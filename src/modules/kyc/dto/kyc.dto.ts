import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { Exclude, Transform } from "class-transformer";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { KycStatus } from "src/modules/users/dto";

export class KYCEntity {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty({ description: `Kyc label can be the user names` })
  label: string | null = null;

  @ApiProperty()
  imageRefs: string[];

  @ApiProperty({
    enum: KycStatus,
    default: KycStatus.SUBMITTED,
  })
  status: KycStatus;

  @ApiProperty()
  message: string;

  @ApiProperty({ description: "KYCd user ID" })
  @Transform(({ value }) => value.toString("hex"))
  user: string;

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
    enum: [KycStatus.VALIDATED, KycStatus.REJECTED],
  })
  @IsIn([KycStatus.VALIDATED, KycStatus.REJECTED])
  status: KycStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  message?: string;

  constructor(kyc: VerifyKYCDto) {
    Object.assign(this, kyc);
  }
}

export class QueryKYCDto extends BulkQueryDto {
  @IsOptional()
  @IsEnum(KycStatus)
  @ApiPropertyOptional({ enum: KycStatus })
  status?: KycStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  userId?: string;

  constructor(props: QueryKYCDto) {
    super(props);
    Object.assign(this, props);
  }
}
