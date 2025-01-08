import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PlacesService } from "../places/places.service";
import { Place } from "../places/schemas/place.schema";
import {
  CreateServiceDto,
  ProviderEntity,
  ServiceParamsDto,
  UpdateServiceDto,
} from "./dto";
import { Offer } from "./offers/schemas/offer.schema";
import { Service } from "./schemas/service.schema";

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
    private readonly placesService: PlacesService,
  ) {}

  async create(
    { place, ...data }: CreateServiceDto,
    createdBy: string,
  ): Promise<Service> {
    let newPlace: Place;
    if (place) {
      newPlace = await this.placesService.create(place);
    }

    const newService = await new this.serviceModel({
      ...data,
      createdBy,
      place: newPlace?.id,
      provider: data.provider ?? createdBy,
    }).save();
    return newService.populate("place");
  }

  async findOne(serviceId: string): Promise<Service> {
    const service = await this.serviceModel
      .findById(serviceId)
      .populate("provider")
      .populate("place")
      .exec();

    if (!service) {
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    }
    return service;
  }

  async findOffers(serviceId: string): Promise<Offer[]> {
    return this.offerModel.find({ service: serviceId }).exec();
  }

  async findAll({
    page,
    perpage,
    keywords,
    latitude,
    longitude,
    maxDistance,
    placeName,
    ...params
  }: ServiceParamsDto): Promise<Service[]> {
    let places: Place[];
    if (placeName || (latitude && longitude && maxDistance)) {
      places = await this.placesService.findNearby({
        latitude,
        longitude,
        maxDistance,
        placeName,
      });
    }

    return this.serviceModel
      .find({
        ...params,
        ...(keywords ? { $text: { $search: keywords } } : {}),
        ...(places?.length
          ? { $or: places.map((pl) => ({ place: pl.id })) }
          : {}),
      })
      .populate("place")
      .populate("provider")
      .limit(perpage)
      .skip(perpage * (page - 1))
      .exec();
  }

  async findProviders({
    page,
    perpage,
    keywords,
    latitude,
    longitude,
    maxDistance,
    placeName,
    ...params
  }: ServiceParamsDto): Promise<ProviderEntity[]> {
    let places: Place[];
    if (placeName || (latitude && longitude && maxDistance)) {
      places = await this.placesService.findNearby({
        latitude,
        longitude,
        maxDistance,
        placeName,
      });
    }

    const distinctProviders = await this.serviceModel
      .distinct("provider", {
        ...params,
        ...(keywords ? { $text: { $search: keywords } } : {}),
        ...(places?.length
          ? { $or: places.map((pl) => ({ place: pl.id })) }
          : {}),
      })
      .exec();

    const distinctServices = await this.serviceModel
      .find({
        ...(distinctProviders?.length
          ? { $or: distinctProviders.map((provider) => ({ provider })) }
          : {}),
      })
      .populate("place")
      .populate("provider")
      .limit(perpage)
      .skip(perpage * (page - 1))
      .exec();

    return distinctServices.map((_) => {
      const { provider, ...service } = _.toJSON();
      return new ProviderEntity({
        service,
        ...(provider as unknown as ProviderEntity),
      });
    });
  }

  async delete(serviceId: string, deletedBy: string): Promise<void> {
    const service = await this.serviceModel.findById(serviceId).exec();
    this.checkPrivileges(serviceId, service, deletedBy);

    await service.deleteOne().exec();
  }

  async update(
    serviceId: string,
    data: UpdateServiceDto,
    updatedBy: string,
  ): Promise<Service> {
    const service = await this.serviceModel.findById(serviceId).exec();
    this.checkPrivileges(serviceId, service, updatedBy);

    await service.updateOne({ ...data, updatedAt: new Date() }).exec();
    return this.serviceModel.findById(serviceId).exec();
  }

  async addImages(
    serviceId: string,
    imageRefs: string[],
    addedBy: string,
  ): Promise<Service> {
    const service = await this.serviceModel.findById(serviceId);
    this.checkPrivileges(serviceId, service, addedBy);

    service.imageRefs.push(...imageRefs);
    return service.save();
  }

  /**
   * Checks that the person wanting to update a document has the required priviliges
   * @param offer
   * @param actor
   */
  private checkPrivileges(serviceId: string, service: Service, actor: string) {
    if (!service) {
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    }
    if (
      service.createdBy.toString() !== actor &&
      service.provider.toString() !== actor
    ) {
      throw new ForbiddenException("Operation not permitted for active user");
    }
  }
}
