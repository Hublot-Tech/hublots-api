import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { OTPController } from "./otp.controller";
import { OTPService } from "./otp.service";
import { OTP, OTPSchema } from "./schemas/otp.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OTP.name, schema: OTPSchema }]),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          baseURL: configService.get("META_MESSAGING_API_BASE_URL"),
          headers: {
            Authorization: `Bearer ${configService.get("META_MESSAGING_API_ACCESS_TOKEN")}`,
          },
        };
      },
    }),
  ],
  controllers: [OTPController],
  providers: [OTPService],
  exports: [OTPService],
})
export class OTPModule {}
