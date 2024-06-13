import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { v4 as uuidv4 } from "uuid";
import { Document } from "mongoose";

@Schema()
export class OfferItem extends Document {
  @Prop({
    type: String,
    required: true,
    default: uuidv4,
    unique: true,
  })
  id: string;

  @Prop({
    type: String,
    required: true,
  })
  description: string;

  @Prop({
    type: String,
    required: true,
  })
  value: string;

  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date;

  toJSON() {
    const user = this.toObject();
    user.id = user._id;
    delete user._id;
    delete user.__v;
    return user;
  }

  constructor(content: OfferItem) {
    super();
    Object.assign(this, content);
  }
}

export const OfferItemSchema = SchemaFactory.createForClass(OfferItem);
