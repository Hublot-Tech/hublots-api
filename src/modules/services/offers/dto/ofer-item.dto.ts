import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString } from "class-validator";

export class CreateOfferItemDto {
  @IsString()
  @ApiProperty({ examples: ["Nombre  de photos", "Couleur"] })
  name: string;

  @IsString()
  @ApiProperty({
    description:
      "Value of the item, can be quantitatif, qualitatif or of any kind that well describes the item",
    examples: [10, "Rouge", "25m"],
  })
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
