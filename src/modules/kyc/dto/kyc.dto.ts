import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { KYCStatus } from "../schemas/kyc.schema";
import { VerificationStatus } from "src/modules/users/dto";
import { Transform } from "class-transformer";
import { IsIn } from "class-validator";

export class KYCEntity {
  @Transform(({ value }) => value.toString("hex"))
  @ApiProperty()
  id: string;

  @ApiProperty()
  imageRefs: string;

  @ApiProperty({
    enum: VerificationStatus,
    default: VerificationStatus.SUBMITTED,
  })
  status: KYCStatus;

  @ApiProperty()
  message: string;

  @ApiProperty()
  user: string;

  @ApiProperty({ type: Date, default: () => Date.now() })
  createdAt: Date;

  @ApiPropertyOptional()
  validatedBy: string;

  constructor(kyc: KYCEntity) {
    Object.assign(this, kyc);
  }
}

export class VerifyKYCDto {
  @ApiProperty({
    description: "KYC validation status, can either reject or validate",
    enum: [VerificationStatus.VALIDATED, VerificationStatus.REJECTED],
  })
  @IsIn([VerificationStatus.VALIDATED, VerificationStatus.REJECTED])
  status: VerificationStatus;

  @ApiPropertyOptional()
  message: string;

  constructor(kyc: VerifyKYCDto) {
    Object.assign(this, kyc);
  }
}
