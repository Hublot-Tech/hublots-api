import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { OTPController } from "./otp.controller";
import { OTPService } from "./otp.service";
import { OTP, OTPSchema } from "./schemas/otp.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OTP.name, schema: OTPSchema }]),
    HttpModule.register({
      baseURL: `https://graph.facebook.com/v20.0/${process.env.META_PHONE_NUMBER_ID}`,
      headers: {
        Authorization: `Bearer ${process.env.META_TEMP_ACCESS_TOKEN}`,
      },
    }),
  ],
  controllers: [OTPController],
  providers: [OTPService],
  exports: [OTPService],
})
export class OTPModule {}
