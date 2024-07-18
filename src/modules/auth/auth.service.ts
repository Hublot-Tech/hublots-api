import {
  ForbiddenException,
  Injectable,
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
import { AuthTokensDto } from "./dto/auth.dto";
import { OTPService } from "../otp/otp.service";
import { VerifyOTPDto } from "../otp/dto/otp.dto";

type TokenType = "access_token" | "refresh_token";
interface IJWTPayload {
  username: string;
  sub: string;
  type?: TokenType;
}

@Injectable()
export class AuthService {
  private static readonly ACCESS_TOKEN_TYPE: TokenType = "access_token";
  private static readonly REFRESH_TOKEN_TYPE: TokenType = "refresh_token";

  constructor(
    private readonly jwtService: JwtService,
    private readonly otpService: OTPService,
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

  async signOut(request: Request) {
    const accessToken = this.extractTokenFromHeader(request);

    const payload = this.jwtService.decode<IJWTPayload>(accessToken);
    await this.usersService.createSignOutLog(payload.sub);
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
      throw new UnauthorizedException("Invalid access token!");
    }

    if (payload.type !== type) {
      throw new UnauthorizedException("Invalid token type!");
    }

    const [log, authorizedUser] = await Promise.all([
      this.usersService.findUserLog(payload.sub),
      this.usersService.findByEmail(payload.username),
    ]);

    if (!log || !authorizedUser) {
      throw new UnauthorizedException("Invalid token payload");
    }

    if (log.logoutAt) {
      throw new UnauthorizedException("User was sign out!");
    }

    if (!authorizedUser.isOTPVerified) {
      throw new UnauthorizedException("OTP verification not completed");
    }

    return authorizedUser;
  }

  async requestAuthzToken(refreshToken: string) {
    await this.authorizeUser(refreshToken, AuthService.REFRESH_TOKEN_TYPE);
    const payload = this.jwtService.decode<IJWTPayload>(refreshToken);

    return this.createAuthzTokens(payload.username, payload.sub);
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

  async verifyUserOTP(otpPayload: VerifyOTPDto, userId: string) {
    await this.otpService.verifyOTP(
      otpPayload.phoneNumber,
      otpPayload.phoneNumber,
    );
    await this.usersService.update(userId, { isOTPVerified: true });
  }

  private async login(user: User): Promise<AuthTokensDto> {
    if (!user.isOTPVerified) {
      await this.otpService.sendOTP(user.phoneNumber);
    }
    const log = await this.usersService.createSignInLog(user.id);
    return this.createAuthzTokens(user.email, log.id);
  }

  private createAuthzTokens(username: string, sub: string) {
    const payload: IJWTPayload = { username, sub };
    const refreshToken = this.jwtService.sign(
      { ...payload, type: "refresh_token" },
      {
        secret: jwtConstants.secret,
        expiresIn: "7d",
      },
    );
    const accessToken = this.jwtService.sign(
      { ...payload, type: "access_token" },
      {
        secret: jwtConstants.secret,
        expiresIn: "24h",
      },
    );
    return new AuthTokensDto({ refreshToken, accessToken });
  }

  extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("No bearer token found!");
    }

    return token;
  }
}
