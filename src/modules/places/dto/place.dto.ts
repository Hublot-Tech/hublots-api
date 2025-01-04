import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePlaceDto {
  @IsString()
  @ApiProperty()
  value: string;

  @IsNumber()
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  longitude: number;

  @IsNumber()
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  latitude: number;

  constructor(place: CreatePlaceDto) {
    Object.assign(this, place);
  }
}

export class PlaceEntity extends CreatePlaceDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  constructor(place: PlaceEntity) {
    super(place);
    Object.assign(this, place);
  }
}

export class PlaceQueryParams extends PartialType(
  OmitType(CreatePlaceDto, ["value"]),
) {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  placeName: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    default: 10000,
    description: "Most distant point from location in meters",
  })
  maxDistance: number = 10000;

  constructor(place: PlaceQueryParams) {
    super(place);
    Object.assign(this, place);
  }
}
