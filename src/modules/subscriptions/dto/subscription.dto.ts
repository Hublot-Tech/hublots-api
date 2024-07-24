import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsString } from "class-validator";
import { SubscriptionPlanType } from "../schemas/subscription-plan.schema";
import { Transform } from "class-transformer";

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
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  constructor(subscription: SubscriptionPlanEntity) {
    super(subscription);
    Object.assign(this, subscription);
  }
}

export class SubscriptionEntity extends SubscriptionPlanEntity {
  @ApiProperty({ type: Date })
  startsAt: Date;

  @ApiProperty({ type: Date })
  endsAt: Date;

  @ApiProperty({ type: String })
  subscriptionPlan: string;

  @ApiProperty({ type: String })
  subscriber: string;

  constructor(subscription: SubscriptionEntity) {
    super(subscription);
    Object.assign(this, subscription);
  }
}
