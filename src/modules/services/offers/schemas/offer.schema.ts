import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";
import { OfferItem } from "./offer-item.schema";

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, offer) {
      offer.id = offer._id;
      delete offer._id;
    },
  },
})
export class Offer extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({
    type: Number,
    required: true,
  })
  estimatedDuration: number;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  createdAt: Date;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  updatedAt: Date;

  // reference to service
  @Prop({ required: true, type: Types.ObjectId, ref: "Service" })
  service: Types.ObjectId;

  //reference to offer items
  @Prop({
    type: [{ type: Types.ObjectId, ref: OfferItem.name, required: true }],
    default: [],
  })
  items: Types.ObjectId[];

  // reference to provider
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  provider: string;

  // reference to creator
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy: string;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
