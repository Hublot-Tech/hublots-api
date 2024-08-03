import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Locale, Role, VerificationStatus } from "../dto/users.dto";

@Schema({
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, user) {
      user.id = user._id;
      delete user._id;
      delete user.password;
    },
  },
})
export class User extends Document {
  @Prop({ type: String, required: true })
  fullname: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    required: true,
    unique: true,
  })
  phoneNumber: string;

  @Prop({
    type: String,
    enum: Locale,
    required: true,
    default: Locale.FR,
  })
  locale: Locale;

  @Prop({
    type: [String],
    enum: Role,
    required: true,
    default: [Role.CLIENT],
  })
  roles: Role[];

  @Prop({
    type: String,
    required: true,
  })
  address: string;

  @Prop({
    type: String,
    required: true,
  })
  password: string;

  @Prop({
    type: String,
    enum: VerificationStatus,
    required: true,
    default: VerificationStatus.NOT_SUBMITTED,
  })
  verificationStatus: VerificationStatus;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  isOnline: boolean;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  isOTPVerified: boolean;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  createdAt: Date;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  updatedAt: Date;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

declare module "express" {
  export interface Request {
    user?: User;
  }
}
