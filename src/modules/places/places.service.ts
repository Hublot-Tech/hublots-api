// place.service.ts

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Place } from "./schemas/place.schema";
import { CreatePlaceDto, PlaceQueryParams } from "./dto/place.dto";

@Injectable()
export class PlacesService {
  constructor(@InjectModel(Place.name) private placeModel: Model<Place>) {}

  // Create a new place
  async create({ name, latitude, longitude }: CreatePlaceDto): Promise<Place> {
    const createdPlace = new this.placeModel({
      name,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });
    return createdPlace.save();
  }

  // Find places near a specific location
  async findNearby({
    latitude,
    longitude,
    maxDistance,
  }: PlaceQueryParams): Promise<Place[]> {
    return this.placeModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance, // in meters
          },
        },
      })
      .exec();
  }
}
