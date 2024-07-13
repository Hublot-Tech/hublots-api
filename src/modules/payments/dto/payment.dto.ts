import { ApiProperty } from "@nestjs/swagger";
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

  @ApiProperty({ type: String })
  customer: string;

  @ApiProperty({ type: Date, default: () => Date.now() })
  createdAt: Date;

  @ApiProperty({ type: UserEntity })
  payer: UserEntity;

  constructor(payment: PaymentEntity) {
    Object.assign(this, payment);
  }
}
