import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreatePlaceDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  longitude: string;

  @IsString()
  @ApiProperty()
  latitude: string;

  constructor(place: CreatePlaceDto) {
    Object.assign(this, place);
  }
}

export class PlaceQueryParams extends OmitType(CreatePlaceDto, ["name"]) {
  @IsNumber()
  @ApiProperty()
  maxDistance: number;

  constructor(place: CreatePlaceDto) {
    super(place);
    Object.assign(this, place);
  }
}
