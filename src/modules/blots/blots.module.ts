import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentsModule } from "../payments/payments.module";
import {
  OfferItem,
  OfferItemSchema,
} from "../services/offers/schemas/offer-item.schema";
import { BlotsController } from "./blots.controller";
import { BlotsService } from "./blots.service";
import { BlotOption, BlotOptionSchema } from "./schemas/blot-option.schema";
import { Blot, BlotSchema } from "./schemas/blot.schema";

@Module({
  imports: [
    PaymentsModule,
    MongooseModule.forFeature([
      { name: Blot.name, schema: BlotSchema },
      { name: OfferItem.name, schema: OfferItemSchema },
      { name: BlotOption.name, schema: BlotOptionSchema },
    ]),
  ],
  controllers: [BlotsController],
  providers: [BlotsService],
})
export class BlotsModule {}
