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
import { TransactionManager } from "src/helpers/tx-manager";
import { Offer, OfferSchema } from "../services/offers/schemas/offer.schema";

@Module({
  imports: [
    PaymentsModule,
    MongooseModule.forFeature([
      { name: Blot.name, schema: BlotSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: OfferItem.name, schema: OfferItemSchema },
      { name: BlotOption.name, schema: BlotOptionSchema },
    ]),
  ],
  controllers: [BlotsController],
  providers: [BlotsService, TransactionManager],
})
export class BlotsModule {}
