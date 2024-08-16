import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum PriceSettingsNames {
  ANNOUNCEMENT = "annoucement",
  EXTRA_SERVICE = "extra_service",
  SPONSORED_SERVICE = "sponsored_service",
  EXTRA_SERVICE_OFFER = "extra_service_offer",
  CUSTOMER_SUPPORT = "customer_support",
  COMMISSION = "commission",
}

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, blot) {
      blot.id = blot._id;
      delete blot._id;
    },
  },
})
export class PriceSettings extends Document {
  @Prop({ type: PriceSettingsNames, required: true, unique: true })
  name: PriceSettingsNames;

  @Prop({ type: Number, default: 0 })
  unitPrice: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, required: true })
  createdBy: Types.ObjectId;
}

export const PriceSettingsSchema = SchemaFactory.createForClass(PriceSettings);
