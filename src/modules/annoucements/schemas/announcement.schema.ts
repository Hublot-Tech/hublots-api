import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Role } from "src/modules/users/dto";
import { User } from "src/modules/users/schemas/user.schema";

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, subs) {
      subs.id = subs._id;
      delete subs._id;
    },
  },
})
export class Announcement extends Document {
  @Prop({ type: Number, required: true })
  duration: number;

  @Prop({ type: Number, default: 0, required: true })
  amountPaid: number;

  @Prop({ type: [String], enum: Role })
  target: Role[];

  @Prop({ type: Date, default: Date.now })
  startsAt: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  createdAt: Date;

  //reference to images
  @Prop({ type: String })
  imageRef: string;

  //reference to provider
  @Prop({ type: [{ type: Types.ObjectId, ref: User.name, required: true }] })
  provider: Types.ObjectId;

  //reference to creator
  @Prop({ type: [{ type: Types.ObjectId, ref: User.name, required: true }] })
  createdBy: Types.ObjectId;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
