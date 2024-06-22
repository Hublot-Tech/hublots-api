import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
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
import { OfferItemDto } from "src/modules/services/offers/dto/ofer-item.dto";
import { BlotStatus } from "../schema/blot.schema";
import { UserEntity } from "src/modules/users/dto";
import { OfferEntity } from "src/modules/services/offers/dto/offer.dto";

export class CreateBlotNestedItemDto extends PartialType(OfferItemDto) {}

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
  @IsString()
  @ApiProperty()
  id: string;

  constructor(blotOption: BlotOptionEntity) {
    super(blotOption);
    Object.assign(this, blotOption);
  }
}

export class CreateBlotDto {
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

  @IsEnum(BlotStatus)
  @ApiProperty({ enum: BlotStatus, default: BlotStatus.CREATED })
  status: BlotStatus;

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

export class UpdateBlotDto extends PartialType(CreateBlotDto) {}

export class BlotEntity extends CreateBlotDto {
  @IsString()
  @ApiProperty()
  id: string;

  @Type(() => BlotOptionEntity)
  @ValidateNested({ each: true })
  @ApiProperty({ type: BlotOptionEntity })
  options: BlotOptionEntity[];

  @IsString()
  @ApiProperty()
  provider: string;

  constructor(blot: BlotEntity) {
    super(blot);
    Object.assign(this, blot);
  }
}

export class BlotQueryParams extends BulkQueryDto {
  @IsString()
  @ApiProperty({ description: "Service provider who created the blot" })
  provider: string;

  @IsString()
  @ApiProperty({ description: "Client for whom the blot was created" })
  consumer: string;

  @IsEnum(BlotStatus)
  @ApiProperty({ enum: BlotStatus, default: BlotStatus.CREATED })
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
  offer: OfferEntity;

  @ApiProperty({ type: UserEntity })
  consumer: UserEntity;

  @ApiProperty({ type: UserEntity })
  provider: UserEntity;

  constructor(blotDetails: BlotDetailsDto) {
    super(blotDetails);
    Object.assign(this, blotDetails);
  }
}
