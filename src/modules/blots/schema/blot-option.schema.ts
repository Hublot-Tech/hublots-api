import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { OfferItem } from "src/modules/services/offers/schema/offer-item.schema";

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
export class BlotOption extends Document {
  // reference to offer item
  @Prop({ type: Number })
  quantity: number;

  // reference to offer
  @Prop({ type: Types.ObjectId, ref: OfferItem.name, required: true })
  item: Types.ObjectId;

  @Prop({ type: String, required: true })
  updatedAt: Date;

  @Prop({ type: String, required: true, default: Date.now })
  createdAt: Date;
}
