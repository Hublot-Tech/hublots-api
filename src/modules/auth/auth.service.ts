import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { jwtConstants } from "../../constants/constants";
import { CreateUserDto } from "../users/dto";
import { User } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";
import { Request } from "express";
import { VerifyOTPDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signIn(email: string, pass: string): Promise<string> {
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

  private async login(user: User) {
    if (!user.isOTPVerified) {
      await this.usersService.createUserOTP(user.phoneNumber);
    }
    const log = await this.usersService.createSignInLog(user.id);
    const payload = { username: user.email, logId: log.id };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: "7d",
    });
  }

  async singUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.register(createUserDto);
    const accessToken = await this.login(user);
    return { accessToken, user };
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

    if (accessToken) {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_SECRET,
      });
      await this.usersService.createSignOutLog(payload.logId);
    }
  }

  async verifyOTP(payload: VerifyOTPDto) {
    return this.usersService.verifiyUserOTP(payload.phoneNumber, payload.otp);
  }

  async authorizeUser(request: Request) {
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException("No bearer token found!");
    }

    let authorizedUser: User;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const log = await this.usersService.findUserLog(payload.logId);
      if (!log.logoutAt) {
        authorizedUser = await this.usersService.findByEmail(payload.username);
      }
    } catch (error) {
      throw new UnauthorizedException("Invalid access token!");
    }

    if (!authorizedUser.isOTPVerified) {
      throw new UnauthorizedException("OTP verification not completed");
    }

    return authorizedUser;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
