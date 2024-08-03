import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { jwtConstants } from "../../constants/constants";
import { OTPModule } from "../otp/otp.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleAuthService } from "./google/google-auth.service";
import { LogsService } from "./logs.service";
import { Log, LogSchema } from "./schemas/log.schema";

@Module({
  imports: [
    OTPModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "3600s" },
    }),
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
  ],
  providers: [AuthService, GoogleAuthService, LogsService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
