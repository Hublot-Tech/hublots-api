import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { VerificationStatus } from "../../users/dto";
import { User } from "../../users/schemas/user.schema";

export type KYCStatus = Exclude<
  VerificationStatus,
  VerificationStatus.NOT_SUBMITTED
>;

export class KYC extends Document {
  @Prop({ type: [{ type: String }] })
  imageRefs: string[];

  @Prop({
    type: String,
    required: true,
    enum: VerificationStatus,
    default: VerificationStatus.SUBMITTED,
  })
  status: KYCStatus;

  @Prop({ type: String })
  message: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, required: true })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  validatedBy: Types.ObjectId;
}

export const KYCSchema = SchemaFactory.createForClass(KYC);
