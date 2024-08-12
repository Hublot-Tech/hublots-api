import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
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

export class PlaceEntity extends CreatePlaceDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  constructor(place: PlaceEntity) {
    super(place);
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
