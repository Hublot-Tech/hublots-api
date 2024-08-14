import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Place } from "src/modules/places/schemas/place.schema";
import { User } from "src/modules/users/schemas/user.schema";

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
  @Prop({ type: String, required: true })
  mainImageRef: string;

  @Prop({ type: Types.ObjectId, ref: Place.name })
  place: Types.ObjectId;

  //reference to the provider
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  provider: Types.ObjectId;

  // reference to creator
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// creating text index on name and description
ServiceSchema.index({ name: "text", description: "text" });
