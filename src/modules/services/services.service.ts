import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateServiceDto, ServiceParamsDto, UpdateServiceDto } from "./dto";
import { Offer } from "./offers/schemas/offer.schema";
import { Service } from "./schemas/service.schema";

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
  ) {}

  async create(data: CreateServiceDto, createdBy: string): Promise<Service> {
    return new this.serviceModel({
      ...data,
      createdBy,
      provider: data.provider ?? createdBy,
    }).save();
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
    ...params
  }: ServiceParamsDto): Promise<Service[]> {
    return this.serviceModel
      .find({ ...params })
      .limit(perpage)
      .skip(perpage * (page - 1))
      .exec();
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
