import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

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
  @IsOptional()
  @ApiPropertyOptional({
    default: 10000,
    description: "Most distant point from location in meters",
  })
  maxDistance: number = 10000;

  constructor(place: CreatePlaceDto) {
    super(place);
    Object.assign(this, place);
  }
}
