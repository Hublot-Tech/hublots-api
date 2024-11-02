import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import { TokenPayload } from "google-auth-library";
import { jwtConstants } from "../../constants/constants";
import { CreateUserDto, Locale } from "../users/dto";
import { User } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import { AuthTokensDto, PasswordPayloadDto } from "./dto/auth.dto";
import { OTPService } from "../otp/otp.service";
import { SendOTPDto, VerifyOTPDto } from "../otp/dto/otp.dto";
import { LogsService } from "./logs.service";
import { OtpReason } from "../otp/schemas/otp.schema";

type TokenType = "access_token" | "refresh_token";
interface IJWTPayload {
  sub: string;
  type: TokenType;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private static readonly ACCESS_TOKEN_TYPE: TokenType = "access_token";
  private static readonly REFRESH_TOKEN_TYPE: TokenType = "refresh_token";

  constructor(
    private readonly jwtService: JwtService,
    private readonly otpService: OTPService,
    private readonly logsService: LogsService,
    private readonly usersService: UsersService,
  ) {}

  async signIn(email: string, pass: string): Promise<AuthTokensDto> {
    const user = await this.usersService.findByEmail(email);
    if (!bcrypt.compareSync(pass, user.password)) {
      throw new UnauthorizedException(
        "Incorrect email or password, please check your connection settings",
      );
    } else if (!user.isActive) {
      throw new ForbiddenException("User account was disactivated !!!");
    }
    return await this.login(user);
  }

  async singUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.register(createUserDto);
    const tokens = await this.login(user);
    return { ...tokens, user };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<User, "password">> {
    const user = await this.usersService.findByEmail(username);
    if (user?.isActive && bcrypt.compareSync(password, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as Omit<User, "password">;
    }
    return null;
  }

  async authorizeUser(
    authzToken: string,
    type: TokenType = AuthService.ACCESS_TOKEN_TYPE,
  ) {
    let payload: IJWTPayload;
    try {
      payload = this.jwtService.verify(authzToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      throw new ForbiddenException(
        `Error validating token (type: ${type}): ${error.message}`,
      );
    }

    if (payload.type !== type) {
      throw new ForbiddenException("Invalid token type!");
    }

    const authorizedUser = await this.usersService.findByEmail(payload.sub);

    if (!authorizedUser) {
      throw new ForbiddenException("Invalid token payload");
    }

    if (!authorizedUser.isActive) {
      throw new ForbiddenException("User access has been temporarily revoked");
    }

    return authorizedUser;
  }

  async requestAuthzToken(refreshToken: string) {
    const user = await this.authorizeUser(
      refreshToken,
      AuthService.REFRESH_TOKEN_TYPE,
    );

    // Invalidate old token
    await this.logsService.invalidate(refreshToken);

    // Generate new tokens
    return this.generateTokens(user);
  }

  async authenticateUser(data: TokenPayload) {
    const payload: CreateUserDto = {
      fullname: data.name,
      email: data.email,
      phoneNumber: null,
      address: null,
      locale: data.locale as Locale,
      password: null,
    };

    let existingUser = await this.usersService.findByEmail(data.email);
    if (!existingUser) {
      existingUser = await this.usersService.register(payload);
    }

    return this.login(existingUser);
  }

  async sendUserOTP(otpPayload: SendOTPDto) {
    const user = await this.usersService.findByPhoneNumber(
      otpPayload.phoneNumber,
    );
    if (!user) {
      throw new NotFoundException(
        `No user was found with phone number: ${otpPayload.phoneNumber}`,
      );
    }
    await this.otpService.send(otpPayload.phoneNumber, otpPayload.reason);
  }

  async verifyUserOTP(otpPayload: VerifyOTPDto) {
    const user = await this.usersService.findByPhoneNumber(
      otpPayload.phoneNumber,
    );
    await this.otpService.verify(otpPayload.phoneNumber, otpPayload.otp);
    return this.usersService.update(user.id, { isOTPVerified: true });
  }

  async signOut(userId: string) {
    await this.logsService.invalidate(userId);
  }

  async setNewPassword(userId: string, payload: PasswordPayloadDto) {
    const user = await this.usersService.findOne(userId);

    //verify otp sent to request password modification
    await this.otpService.verify(
      user.phoneNumber,
      payload.otpCode,
      OtpReason.PASSWORD_RESET,
    );

    return this.usersService.update(user.id, {
      password: bcrypt.hashSync(
        payload.newPassword,
        parseInt(process.env.BCRYPT_SALT),
      ),
    });
  }

  async login(user: User): Promise<AuthTokensDto> {
    if (!user.isOTPVerified) {
      await this.otpService.send(user.phoneNumber, OtpReason.EMAIL);
    }
    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const refreshToken = this.jwtService.sign(
      { sub: user.email, type: "refresh_token" },
      {
        secret: jwtConstants.secret,
        expiresIn: "7d",
      },
    );
    const accessToken = this.jwtService.sign(
      { sub: user.email, type: "access_token" },
      {
        secret: jwtConstants.secret,
        expiresIn: "24h",
      },
    );

    await this.logsService.create(user.id, refreshToken);
    return new AuthTokensDto({ refreshToken, accessToken });
  }

  extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    if (type !== "Bearer" || !token) {
      throw new ForbiddenException("No access token found!");
    }

    return token;
  }
}
