// place.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

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
export class Place extends Document {
  @Prop({ required: true })
  value: string;

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export const PlaceSchema = SchemaFactory.createForClass(Place);

// Add 2dsphere index
PlaceSchema.index({ location: "2dsphere", name: "text" });
