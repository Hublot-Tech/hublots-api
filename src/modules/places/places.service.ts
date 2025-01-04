// place.service.ts

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Place } from "./schemas/place.schema";
import { CreatePlaceDto, PlaceQueryParams } from "./dto/place.dto";
import { HttpService } from "@nestjs/axios";

// Function to extract lon, lat, and formatted from FeatureCollection
export function extractLocations(featureCollection: any): CreatePlaceDto[] {
  return featureCollection.features.map(
    (feature: any) =>
      new CreatePlaceDto({
        value: feature.properties.formatted,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
      }),
  );
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Place.name) private placeModel: Model<Place>,
  ) {}

  // Create a new place
  async create({ value, latitude, longitude }: CreatePlaceDto): Promise<Place> {
    const createdPlace = new this.placeModel({
      value,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });
    return createdPlace.save();
  }

  // Find places near a specific location
  async findNearby({
    latitude,
    longitude,
    maxDistance,
    placeName,
  }: PlaceQueryParams): Promise<Place[]> {
    return this.placeModel
      .find({
        $or: [
          ...(placeName ? [{ $text: { $search: placeName } }] : []),
          {
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                $maxDistance: maxDistance, // in meters
              },
            },
          },
        ],
      })
      .exec();
  }

  async search(search: string): Promise<CreatePlaceDto[]> {
    const resp = await this.httpService.axiosRef.get(
      `/autocomplete?text=${search}`,
    );
    return extractLocations(resp.data);
  }
}
