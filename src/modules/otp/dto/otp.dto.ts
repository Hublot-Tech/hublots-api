import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class SendOTPDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Defaults to the connected user phone number",
  })
  phoneNumber?: string;

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
