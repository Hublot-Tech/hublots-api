import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from "./schemas/subscription-plan.schema";
import {
  Subscription,
  SubscriptionSchema,
} from "./schemas/subscription.schema";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [
    PaymentsModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
    ]),
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
