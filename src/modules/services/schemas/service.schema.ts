import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";
import { Offer } from "../offers/schemas/offer.schema";

export enum Category {
  SCHOOL_SUPPORT = "school_support",
  RENOVATION = "renovation",
  DELIVERY = "develivery",
  RELOCATION = "relocation",
  CLEANING = "cleaning",
  HEALTH = "health",
  SALON_SPA = "salon_spa",
  TECHNICIANS = "technician",
  RESTAURANTION = "restauration",
  IT = "information_technologies",
}

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, user) {
      user.id = user._id;
      delete user._id;
    },
  },
})
export class Service extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  createdAt: Date;

  @Prop({
    type: String,
    enum: Category,
    required: true,
  })
  category: Category;

  //reference to images
  @Prop({
    default: [],
    type: [{ type: String }],
  })
  imageRefs: string[];

  // reference to main image
  @Prop({ type: String, default: null })
  mainImageRef: string;

  //reference to offers
  @Prop({
    default: [],
    type: [{ type: Types.ObjectId, ref: Offer.name, required: true }],
  })
  offers: Types.ObjectId[];

  //reference to the provider
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  provider: Types.ObjectId;

  // reference to creator
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
