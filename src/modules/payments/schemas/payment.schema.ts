import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { PaymentStatus } from "src/helpers/payment-status";
import { User } from "src/modules/users/schemas/user.schema";

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, payment) {
      payment.id = payment._id;
      delete payment._id;
    },
  },
})
export class Payment extends Document {
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, unique: true, required: true })
  currency: string;

  @Prop({ type: String, unique: true, required: true })
  reference: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, enum: PaymentStatus, required: true })
  status: PaymentStatus;

  @Prop({ type: String, required: true })
  customer: string;

  @Prop({ type: Date, required: true, default: Date.now() })
  createdAt: Date;

  // reference to payer
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  payer: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
