import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString } from "class-validator";

export class CreateOfferItemDto {
  @IsString()
  @ApiProperty()
  description: string;

  @IsString()
  @ApiProperty()
  value: string;

  constructor(item: CreateOfferItemDto) {
    Object.assign(this, item);
  }
}

export class UpdateOfferItemDto extends PartialType(CreateOfferItemDto) {}

export class OfferItemEntity extends CreateOfferItemDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  constructor(item: OfferItemEntity) {
    super(item);
    Object.assign(this, item);
  }
}
