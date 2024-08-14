import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FilesModule } from "../files/files.module";
import { UsersModule } from "../users/users.module";
import { OffersModule } from "./offers/offers.module";
import { Offer, OfferSchema } from "./offers/schemas/offer.schema";
import { Service, ServiceSchema } from "./schemas/service.schema";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import { PlacesModule } from "../places/places.module";

@Module({
  imports: [
    FilesModule,
    UsersModule,
    OffersModule,
    PlacesModule,
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
