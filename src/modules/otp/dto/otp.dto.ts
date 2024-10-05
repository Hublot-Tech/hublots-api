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
    default: OtpReason.EMAIL,
    description: "Reason for requesting code.",
  })
  reason: OtpReason = OtpReason.EMAIL;

  constructor(otp: SendOTPDto) {
    Object.assign(this, otp);
  }
}

export class VerifyOTPDto {
  @IsString()
  @ApiProperty()
  phoneNumber: string;

  @Length(6)
  @IsString()
  @ApiProperty()
  otp: string;

  constructor(otp: VerifyOTPDto) {
    Object.assign(this, otp);
  }
}
