import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SubscriptionPlan } from "./subscription-plan.schema";

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, subs) {
      subs.id = subs._id;
      delete subs._id;
    },
  },
})
export class Subscription extends SubscriptionPlan {
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  startsAt: Date;

  @Prop({ required: true })
  endsAt: Date;
}

export const SubscriptionSchema =
  SchemaFactory.createForClass(SubscriptionPlan);
