import { Module } from "@nestjs/common";
import { BlotsController } from "./blots.controller";
import { BlotsService } from "./blots.service";
import {
  OfferItem,
  OfferItemSchema,
} from "../services/offers/schema/offer-item.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { Blot, BlotSchema } from "./schema/blot.schema";
import { BlotOption, BlotOptionSchema } from "./schema/blot-option.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OfferItem.name, schema: OfferItemSchema },
    ]),
    MongooseModule.forFeature([{ name: Blot.name, schema: BlotSchema }]),
    MongooseModule.forFeature([
      { name: BlotOption.name, schema: BlotOptionSchema },
    ]),
  ],
  controllers: [BlotsController],
  providers: [BlotsService],
})
export class BlotsModule {}
