import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SubscriptionPlan } from "./subscription-plan.schema";
import { Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";
import { Payment } from "src/modules/payments/schemas/payment.schema";

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
  @Prop({ required: true, default: Date.now })
  startsAt: Date;

  @Prop({ required: true })
  endsAt: Date;

  // reference to subscriber
  @Prop({ type: Types.ObjectId, ref: SubscriptionPlan.name, required: true })
  subscriptionPlan: Types.ObjectId;

  // reference to payment
  @Prop({ type: Types.ObjectId, ref: Payment.name, required: true })
  payment: Types.ObjectId;

  // reference to subscriber
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  subscriber: Types.ObjectId;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
