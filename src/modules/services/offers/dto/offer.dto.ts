import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Exclude, Transform, Type } from "class-transformer";
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { ServiceEntity } from "../../dto";
import { CreateOfferItemDto } from "./ofer-item.dto";
import { UserEntity } from "src/modules/users/dto";

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

class ModifiableOfferDto extends OmitType(CreateOfferDto, [
  "items",
  "service",
]) {}
export class UpdateOfferDto extends PartialType(ModifiableOfferDto) {}

export class OfferEntity extends ModifiableOfferDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty({ description: "Related service id" })
  @Transform(({ value }) => value.toString("hex"))
  service: string;

  @Exclude()
  @ApiHideProperty()
  createdBy: string;

  constructor(offer: OfferEntity) {
    super(offer);
    Object.assign(this, offer);
  }
}

export class OfferDetailsDto extends ModifiableOfferDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty({ type: ServiceEntity })
  @Transform(({ value }) => new ServiceEntity(value))
  service: ServiceEntity;

  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  provider: UserEntity;

  @Exclude()
  @ApiHideProperty()
  createdBy: string;

  constructor(offer: OfferDetailsDto) {
    super(offer);
    Object.assign(this, offer);
  }
}
