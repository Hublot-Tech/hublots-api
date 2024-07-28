import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";
import { Offer } from "./offer.schema";

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, item) {
      item.id = item._id;
      delete item._id;
    },
  },
})
export class OfferItem extends Document {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
  })
  value: string;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  createdAt: Date;

  //reference to offer items
  @Prop({ type: Types.ObjectId, ref: Offer.name, required: true })
  offer: Types.ObjectId;

  // reference to creator
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy: string;
}

export const OfferItemSchema = SchemaFactory.createForClass(OfferItem);
