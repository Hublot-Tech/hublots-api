import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { PaymentStatus } from "src/helpers/payment-status";
import { UserEntity } from "src/modules/users/dto";

export class PaymentEntity {
  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: String })
  reference: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({
    description:
      "When returned, redirect the user to the provided link for payment completion",
  })
  authorization_url?: string;

  @ApiProperty({ type: String })
  customer: string;

  @ApiProperty({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty({ type: UserEntity })
  payer: UserEntity;

  constructor(payment: PaymentEntity) {
    Object.assign(this, payment);
  }
}

export class InitializePaymentDto {
  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Customer email. default to the connected user email",
  })
  email?: string;

  @IsString()
  @ApiProperty({ type: String, description: "Describe payment reason" })
  description: string;

  constructor(payment: InitializePaymentDto) {
    Object.assign(this, payment);
  }
}

export class DirectChargePaymentDto extends InitializePaymentDto {
  @IsOptional()
  @IsPhoneNumber("CM")
  @ApiProperty({
    description: "Customer phone number, paying phone number",
    examples: ["674481721", "674000000", "656019261", "656000000"],
  })
  phoneNumber?: string;

  constructor(payload: DirectChargePaymentDto) {
    super(payload);
    Object.assign(this, payload);
  }
}
