import { HttpService } from "@nestjs/axios";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { generateOtp } from "src/helpers/otp-generator";
import { OTP } from "./schemas/otp.schema";

@Injectable()
export class OTPService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(OTP.name) private readonly otpModel: Model<OTP>,
  ) {}

  async sendOTP(phoneNumber: string) {
    const otp = new this.otpModel({
      phoneNumber,
      otp: generateOtp(6),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    if (process.env.META_PHONE_NUMBER_ID) {
      await this.httpService.axiosRef.post(
        "/messages",
        this.getTemplateMessageBody(phoneNumber, otp.otp),
      );
    }

    await otp.save();
  }

  async verifyOTP(phoneNumber: string, otp: string) {
    const userOTP = await this.otpModel
      .findOne({ phoneNumber, otp })
      .sort({ createdAt: -1 })
      .exec();

    if (!userOTP) {
      throw new UnauthorizedException(`Incorrect One time password`);
    }

    if (userOTP.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(`One time password has expired`);
    }
  }

  private getTemplateMessageBody(phoneNumber: string, otp: string) {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "template",
      template: {
        name: "verification_code",
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
      },
    };
  }
}
