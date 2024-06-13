import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

@Schema()
export class Offer extends Document {
  @Prop({ required: true, default: uuidv4, unique: true })
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({
    type: Number,
    required: true,
  })
  estimated_duration: number;

  //reference to offers
  @Prop({ type: [{ type: Types.ObjectId, ref: "OfferItem", required: true }] })
  items: Types.ObjectId[];
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
