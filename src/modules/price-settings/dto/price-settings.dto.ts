import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { PriceSettingsNames } from "../schemas/price-settings.schema";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreatePriceSettingsDto {
  @IsEnum(PriceSettingsNames)
  @ApiProperty({ enum: PriceSettingsNames })
  name: PriceSettingsNames;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  unitPrice?: number;

  constructor(props: CreatePriceSettingsDto) {
    Object.assign(this, props);
  }
}

export class UpdatePriceSettingsDto extends PartialType(
  CreatePriceSettingsDto,
) {}

export class PriceSettingsEntity extends CreatePriceSettingsDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  constructor(props: PriceSettingsEntity) {
    super(props);
    Object.assign(this, props);
  }
}
