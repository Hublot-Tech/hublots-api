import { Module } from "@nestjs/common";
import { OffersService } from "./offers.service";
import { OffersController } from "./offers.controller";
import { Offer, OfferSchema } from "./schemas/offer.schema";
import { OfferItem, OfferItemSchema } from "./schemas/offer-item.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { Service, ServiceSchema } from "../schemas/service.schema";
import { TransactionManager } from "src/helpers/tx-manager";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
    MongooseModule.forFeature([
      { name: OfferItem.name, schema: OfferItemSchema },
    ]),
  ],
  providers: [OffersService, TransactionManager],
  controllers: [OffersController],
})
export class OffersModule {}
