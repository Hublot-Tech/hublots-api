import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";

export enum MsgContentType {
  FILE = "file",
  TEXT = "text",
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
export class Message extends Document {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, enum: MsgContentType, required: true })
  contentType: MsgContentType;

  // reference to sender
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  sender: Types.ObjectId;

  // reference to receiver
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  receiver: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deliveredAt: Date;

  @Prop({ type: Date, default: null })
  readAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
