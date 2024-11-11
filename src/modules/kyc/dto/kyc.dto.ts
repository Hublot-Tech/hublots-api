import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { Exclude, Transform } from "class-transformer";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { UserEntity, VerificationStatus } from "src/modules/users/dto";
import { KYCStatus } from "../schemas/kyc.schema";

export class KYCEntity {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
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

  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  user: UserEntity;

  @ApiProperty({ type: Date, default: () => Date.now() })
  createdAt: Date;

  @Exclude()
  @ApiHideProperty()
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

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  message?: string;

  constructor(kyc: VerifyKYCDto) {
    Object.assign(this, kyc);
  }
}

export class QueryKYCDto extends BulkQueryDto {
  @IsEnum(VerificationStatus)
  @ApiPropertyOptional({ enum: VerificationStatus })
  status?: VerificationStatus;

  @IsString()
  @ApiPropertyOptional()
  userId?: string;

  constructor(props: QueryKYCDto) {
    super(props);
    Object.assign(this, props);
  }
}
