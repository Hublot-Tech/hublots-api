import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { jwtConstants } from "../../constants/constants";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleAuthService } from "./google/google-auth.service";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "3600s" },
    }),
    PassportModule,
  ],
  providers: [AuthService, GoogleAuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
