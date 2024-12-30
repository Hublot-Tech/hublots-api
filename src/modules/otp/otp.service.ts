import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { generateOtp } from "src/helpers/otp-generator";
import { OTP, OtpReason } from "./schemas/otp.schema";

@Injectable()
export class OTPService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(OTP.name) private readonly otpModel: Model<OTP>,
  ) {}

  async findLatest(phoneNumber: string, reason: OtpReason) {
    const otp = await this.otpModel
      .findOne({
        phoneNumber,
        reason,
        createdAt: { $gte: new Date(Date.now() - 3 * 60 * 1000) },
      })
      .exec();

    return otp;
  }

  async send(phoneNumber: string, reason: OtpReason = OtpReason.PHONE_NUMBER) {
    const otp = new this.otpModel({
      reason,
      phoneNumber,
      otp: generateOtp(6),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    if (!process.env.META_MESSAGING_API_BASE_URL) {
      throw new InternalServerErrorException(
        `Meta phone number ID not provided!`,
      );
    }

    await this.httpService.axiosRef.post(
      "/messages",
      this.getTemplateMessageBody(phoneNumber, otp.otp),
    );

    await otp.save();
  }

  async verify(
    phoneNumber: string,
    otp: string,
    reason: OtpReason = OtpReason.PHONE_NUMBER,
  ) {
    const userOTP = await this.otpModel
      .findOne({ phoneNumber, otp, reason })
      .sort({ createdAt: -1 })
      .exec();

    if (!userOTP || userOTP.expiresAt.getTime() < Date.now()) {
      return false;
    }

    await this.otpModel.updateOne({ isVerified: true });
    return true;
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
          code: "en",
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
