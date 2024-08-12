import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PlacesService } from "./places.service";
import { Place, PlaceSchema } from "./schemas/place.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }]),
  ],
  providers: [PlacesService],
})
export class PlacesModule {}
