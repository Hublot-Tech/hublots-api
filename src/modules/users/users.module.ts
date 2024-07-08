import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthService } from "../auth/auth.service";
import { Log, LogSchema } from "./schemas/log.schema";
import { OTP, OTPSchema } from "./schemas/otp.schema";
import { User, UserSchema } from "./schemas/user.schema";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: OTP.name, schema: OTPSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService],
  exports: [UsersService],
})
export class UsersModule {}
