import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Image extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  contentType: string;

  @Prop({ required: true })
  length: number;

  @Prop({ required: true })
  uploadDate: Date;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
