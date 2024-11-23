import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum OtpReason {
  PHONE_NUMBER = "phone_verification",
  FUNDS_TRANSFER = "funds_transfer",
  PASSWORD_RESET = "password_reset",
}

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, user) {
      user.id = user._id;
      delete user._id;
    },
  },
})
export class OTP extends Document {
  @Prop({ type: String, required: true })
  otp: string;

  @Prop({ enum: OtpReason, default: OtpReason.PHONE_NUMBER })
  reason: OtpReason;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: String, required: true })
  phoneNumber: string;

  @Prop({ type: Date, required: true, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const OTPSchema = SchemaFactory.createForClass(OTP);
