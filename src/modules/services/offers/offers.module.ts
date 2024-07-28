import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TransactionManager } from "src/helpers/tx-manager";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { OffersController } from "./offers.controller";
import { OffersService } from "./offers.service";
import { OfferItem, OfferItemSchema } from "./schemas/offer-item.schema";
import { Offer, OfferSchema } from "./schemas/offer.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: OfferItem.name, schema: OfferItemSchema },
    ]),
  ],
  providers: [OffersService, TransactionManager],
  controllers: [OffersController],
})
export class OffersModule {}
