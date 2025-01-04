import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { KycStatus } from "../../users/dto";
import { User } from "../../users/schemas/user.schema";

export type KYCStatus = Exclude<
  KycStatus,
  KycStatus.NOT_SUBMITTED
>;

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
export class KYC extends Document {
  @Prop({ type: String, required: true })
  label: string;

  @Prop({
    type: String,
    required: true,
    enum: KycStatus,
    default: KycStatus.SUBMITTED,
  })
  status: KYCStatus;

  @Prop({ type: [{ type: String }] })
  imageRefs: string[];

  @Prop({ type: String })
  message: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, required: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now, required: true })
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  validatedBy: Types.ObjectId;
}

export const KYCSchema = SchemaFactory.createForClass(KYC);
