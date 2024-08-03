import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "../../users/schemas/user.schema";

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

  @Prop({ type: String, required: true, unique: true })
  refreshToken: string;

  @Prop({ type: Boolean, default: true })
  isValid: boolean;

  //reference to user
  @Prop({ type: [{ type: Types.ObjectId, ref: User.name, required: true }] })
  user: Types.ObjectId;
}

export const LogSchema = SchemaFactory.createForClass(Log);
