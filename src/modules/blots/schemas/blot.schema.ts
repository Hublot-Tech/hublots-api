import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Offer } from "src/modules/services/offers/schemas/offer.schema";
import { BlotOption } from "./blot-option.schema";
import { User } from "src/modules/users/schemas/user.schema";

export enum BlotStatus {
  CREATED = "created",
  VALIDATED = "validated",
  GOT_IN_TOUCH = "getting_in_touch",
  STARTED_WORK = "starte_work",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
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
export class Blot extends Document {
  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, required: true, default: Date.now })
  startDate: Date;

  @Prop({ type: Number, required: true })
  duration: number;

  @Prop({
    type: String,
    enum: BlotStatus,
    default: BlotStatus.CREATED,
    required: true,
  })
  status: BlotStatus;

  @Prop({ type: String, required: true })
  updatedAt: Date;

  @Prop({ type: String, required: true, default: Date.now })
  createdAt: Date;

  // reference to offer
  @Prop({ type: Types.ObjectId, ref: Offer.name })
  offer: Types.ObjectId;

  // reference to custom options
  @Prop({
    default: [],
    type: [{ type: Types.ObjectId, ref: BlotOption.name, required: true }],
  })
  options: Types.ObjectId[];

  // reference to consumer
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  consumer: Types.ObjectId;

  // reference to creator
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  provider: Types.ObjectId;
}

export const BlotSchema = SchemaFactory.createForClass(Blot);
