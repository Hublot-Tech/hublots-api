import { ApiProperty, PartialType } from "@nestjs/swagger";
import { SubscriptionPlanType } from "../schemas/subscription-plan.schema";
import { IsBoolean, IsEnum, IsNumber, IsString } from "class-validator";

export class CreateSubscriptionPlanDto {
  @IsEnum(SubscriptionPlanType)
  @ApiProperty({ enum: SubscriptionPlanType })
  type: SubscriptionPlanType;

  @IsString()
  @ApiProperty()
  name: string;

  @IsNumber()
  @ApiProperty()
  price: number;

  @IsNumber()
  @ApiProperty()
  services: number;

  @IsNumber()
  @ApiProperty()
  offers: number;

  @IsNumber()
  @ApiProperty()
  prestations: number;

  @IsNumber()
  @ApiProperty()
  sponsoredServices: number;

  @IsNumber()
  @ApiProperty()
  announcements: number;

  @IsBoolean()
  @ApiProperty()
  assistance: boolean;

  constructor(subscription: CreateSubscriptionPlanDto) {
    Object.assign(this, subscription);
  }
}

export class UpdateSubscriptionPlanDto extends PartialType(
  CreateSubscriptionPlanDto,
) {}

export class SubscriptionPlanEntity extends CreateSubscriptionPlanDto {
  @ApiProperty()
  id: string;

  constructor(subscription: SubscriptionPlanEntity) {
    super(subscription);
    Object.assign(this, subscription);
  }
}
