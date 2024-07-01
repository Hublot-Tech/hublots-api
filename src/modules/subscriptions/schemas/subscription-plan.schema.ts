import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum SubscriptionPlanType {
  MONTHLY = "monthly",
  ANNUAL = "annual",
}

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
export class SubscriptionPlan extends Document {
  @Prop({
    type: String,
    enum: SubscriptionPlanType,
    default: SubscriptionPlanType.MONTHLY,
  })
  type: SubscriptionPlanType;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true })
  services: number;

  @Prop({ type: Number, required: true })
  offers: number;

  @Prop({ type: Number, required: true })
  prestations: number;

  @Prop({ type: Number, required: true })
  sponsoredServices: number;

  @Prop({ type: Number, required: true })
  announcements: number;

  @Prop({ type: Boolean, required: true })
  assistance: boolean;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);
