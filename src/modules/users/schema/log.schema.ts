import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

@Schema()
export class Log extends Document {
  @Prop({ required: true, default: uuidv4, unique: true })
  id: string;

  @Prop({
    type: Date,
    required: true,
    default: () => new Date(),
  })
  loginAt: Date;

  @Prop({
    type: Date,
    required: false,
  })
  logoutAt: Date;

  toJSON() {
    const log = this.toObject();
    log.id = log._id;
    delete log._id;
    delete log.__v;
    return log;
  }

  constructor(log: Log) {
    super();
    Object.assign(this, log);
  }
}

export const LogSchema = SchemaFactory.createForClass(Log);
