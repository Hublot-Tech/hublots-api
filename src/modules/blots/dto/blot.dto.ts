import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { OfferItemDto } from "src/modules/services/offers/dto/ofer-item.dto";
import { BlotStatus } from "../schema/blot.schema";

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
  @ApiProperty({ description: "selected offer ID" })
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

  constructor(order: CreateBlotDto) {
    Object.assign(this, order);
  }
}

export class UpdateBlotDto extends PartialType(CreateBlotDto) {}

export class BlotEntity {
  @IsString()
  @ApiProperty()
  id: string;

  @Type(() => BlotOptionEntity)
  @ValidateNested({ each: true })
  @ApiProperty({ type: BlotOptionEntity })
  options: BlotOptionEntity[];

  constructor(order: BlotEntity) {
    Object.assign(this, order);
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
