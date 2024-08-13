import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PlacesService } from "./places.service";
import { Place, PlaceSchema } from "./schemas/place.schema";
import { HttpModule } from "@nestjs/axios";
import { PlacesController } from "./places.controller";

@Module({
  imports: [
    HttpModule.register({
      baseURL: "https://api.geoapify.com/v1/geocode",
      params: { apiKey: process.env.GEOAPIFY_KEY },
    }),
    MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }]),
  ],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
