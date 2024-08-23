import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Exclude, Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { OfferItemEntity } from "src/modules/services/offers/dto/ofer-item.dto";
import { OfferEntity } from "src/modules/services/offers/dto/offer.dto";
import { UserEntity } from "src/modules/users/dto";
import { BlotStatus } from "../schemas/blot.schema";

export class CreateBlotNestedItemDto extends PartialType(OfferItemEntity) {}

export class CreateBlotOptionDto {
  @IsNumber()
  @ApiProperty()
  quantity: number;

  @IsObject()
  @ValidateNested()
  @Type(() => CreateBlotNestedItemDto)
  @ApiProperty({ type: CreateBlotNestedItemDto })
  item: CreateBlotNestedItemDto;

  constructor(blotOption: CreateBlotOptionDto) {
    Object.assign(this, blotOption);
  }
}

export class BlotOptionEntity extends CreateBlotOptionDto {
  @Transform(({ value }) => value.toString("hex"))
  @ApiProperty()
  id: string;

  constructor(blotOption: BlotOptionEntity) {
    super(blotOption);
    Object.assign(this, blotOption);
  }
}

export class CreateBlotDto {
  @IsNumber()
  @ApiProperty()
  price: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: "Selected offer ID" })
  offer: string;

  @IsString()
  @ApiProperty()
  decription: string;

  @IsNumber()
  @ApiProperty()
  duration: number;

  @IsDateString()
  @ApiProperty()
  startDate: Date;

  @IsArray()
  @Type(() => CreateBlotOptionDto)
  @ValidateNested({ each: true })
  @ApiProperty({ type: [CreateBlotOptionDto] })
  options: CreateBlotOptionDto[];

  @IsString()
  @ApiProperty({ description: "The client that the blot is created for." })
  consumer: string;

  constructor(blot: CreateBlotDto) {
    Object.assign(this, blot);
  }
}

export class UpdateBlotStatusDto {
  @IsEnum(BlotStatus)
  @ApiProperty({ enum: BlotStatus, default: BlotStatus.CREATED })
  status: BlotStatus;

  constructor(props: UpdateBlotStatusDto) {
    Object.assign(this, props);
  }
}

export class UpdateBlotDto extends PartialType(
  OmitType(CreateBlotDto, ["options"]),
) {
  @Exclude()
  @ApiHideProperty()
  payment?: string;

  @Exclude()
  @ApiHideProperty()
  payoutRef?: string;

  constructor(blot: UpdateBlotDto) {
    super(blot);
    Object.assign(this, blot);
  }
}

export class BlotEntity extends IntersectionType(
  CreateBlotDto,
  UpdateBlotStatusDto,
) {
  @Transform(({ value }) => value.toString("hex"))
  @ApiProperty()
  id: string;

  @Type(() => BlotOptionEntity)
  @ValidateNested({ each: true })
  @ApiProperty({ type: BlotOptionEntity })
  options: BlotOptionEntity[];

  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  provider: string;

  @Transform(({ value }) => value.toString("hex"))
  @ApiProperty({ description: "Reference payment for this blot" })
  payment: string;

  @Transform(({ value }) => value.toString("hex"))
  @ApiProperty({ description: "Reference payout payment for this blot" })
  payoutRef: string;

  constructor(blot: BlotEntity) {
    super(blot);
    Object.assign(this, blot);
  }
}

export class BlotQueryParams extends BulkQueryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: "The service provider who created the blot",
  })
  provider?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: "The customer for whom the blot was created",
  })
  consumer: string;

  @IsOptional()
  @IsEnum(BlotStatus)
  @ApiPropertyOptional({ enum: BlotStatus, default: BlotStatus.CREATED })
  status: BlotStatus;

  constructor(params: BlotQueryParams) {
    super(params);
    Object.assign(this, params);
  }
}

export class BlotDetailsDto extends OmitType(BlotEntity, [
  "consumer",
  "offer",
  "provider",
]) {
  @ApiPropertyOptional({ type: OfferEntity })
  @Transform(({ value }) => new OfferEntity(value))
  offer: OfferEntity;

  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  consumer: UserEntity;

  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  provider: UserEntity;

  constructor(blotDetails: BlotDetailsDto) {
    super(blotDetails);
    Object.assign(this, blotDetails);
  }
}
