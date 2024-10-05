import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
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

  async sendOTP(phoneNumber: string, reason: OtpReason = OtpReason.EMAIL) {
    const otp = new this.otpModel({
      reason,
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

  async verifyOTP(
    phoneNumber: string,
    otp: string,
    reason: OtpReason = OtpReason.EMAIL,
  ) {
    const userOTP = await this.otpModel
      .findOne({ phoneNumber, otp, reason })
      .sort({ createdAt: -1 })
      .exec();

    if (!userOTP) {
      throw new UnauthorizedException(`Incorrect One time password`);
    }

    if (userOTP.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(`One time password has expired`);
    }

    await this.otpModel.updateOne({ isVerified: true });
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
