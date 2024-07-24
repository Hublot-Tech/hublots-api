import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { CreateOfferItemDto, OfferItemDto } from "./ofer-item.dto";
import { Transform, Type } from "class-transformer";

export class CreateOfferDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsNumber()
  @ApiProperty()
  price: number;

  @IsNumber()
  @ApiProperty({
    description: "Estimated duration for work completion in hours",
  })
  estimatedDuration: number;

  @IsMongoId()
  @ApiProperty({ description: "Related service id" })
  service: string;

  @IsArray()
  @Type(() => CreateOfferItemDto)
  @ValidateNested({ each: true })
  @ApiPropertyOptional({ type: [CreateOfferItemDto] })
  items: CreateOfferItemDto[] = [];

  constructor(createOffer: CreateOfferDto) {
    Object.assign(this, createOffer);
  }
}

export class OfferWithoutItemsDto extends OmitType(CreateOfferDto, ["items"]) {}
export class UpdateOfferDto extends PartialType(OfferWithoutItemsDto) {}

export class OfferEntity extends OfferWithoutItemsDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty()
  @IsString({ each: true })
  items: string[];

  constructor(offer: OfferEntity) {
    super(offer);
    Object.assign(this, offer);
  }
}

export class OfferDetailsDto extends OfferWithoutItemsDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty({ type: [OfferItemDto] })
  @Transform(({ value }) => value.map((val) => new OfferItemDto(val)))
  items: OfferItemDto[];

  constructor(offer: OfferEntity) {
    super(offer);
    Object.assign(this, offer);
  }
}
