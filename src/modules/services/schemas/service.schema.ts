import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";
import { Offer } from "../offers/schemas/offer.schema";

export enum Category {
  SCHOOL_SUPPORT = "Soutien scolaire",
  RENOVATION = "Rénovation",
  DELIVERY = "Livraison",
  RELOCATION = "Déménagement",
  CLEANING = "Nettoyage",
  HEALTH = "Santé",
  SALON_SPA = "Salon & Spa",
  TECHNICIANS = "Techniciens",
  RESTAURANT = "Restauration",
  IT = "Informatique",
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

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: String, required: true })
  updatedAt: Date;

  @Prop({ type: String, required: true, default: Date.now })
  createdAt: Date;

  @Prop({
    type: String,
    enum: Category,
    required: true,
  })
  category: Category;

  //reference to images
  imageRefs: string[];

  // reference to main image
  @Prop({ type: String, required: true })
  mainImageRef: string;

  //reference to offers
  @Prop({ type: [{ type: Types.ObjectId, ref: Offer.name, required: true }] })
  offers: Types.ObjectId[];

  //reference to the provider
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  provider: Types.ObjectId;

  // reference to creator
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
