import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { OtpReason } from "../schemas/otp.schema";

export class SendOTPDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: "WhatsApp phone number" })
  phoneNumber: string;

  @IsEnum(OtpReason)
  @IsOptional()
  @ApiProperty({
    default: OtpReason.PHONE_NUMBER,
    enum: OtpReason,
    description: "Reason for requesting code.",
  })
  reason: OtpReason = OtpReason.PHONE_NUMBER;

  constructor(otp: SendOTPDto) {
    Object.assign(this, otp);
  }
}

export class VerifyOTPDto extends SendOTPDto {
  @IsString()
  @ApiProperty()
  phoneNumber: string;

  @Length(6)
  @IsString()
  @ApiProperty()
  otpCode: string;

  constructor(props: VerifyOTPDto) {
    super(props);
    Object.assign(this, props);
  }
}
