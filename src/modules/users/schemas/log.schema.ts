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
export class Log extends Document {
  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  loginAt: Date;

  @Prop({
    type: Date,
    required: false,
  })
  logoutAt: Date;

  @Prop({
    type: Number,
    required: true,
    default: process.env.MAX_AGE,
  })
  tokenDuration: number;
}

export const LogSchema = SchemaFactory.createForClass(Log);
