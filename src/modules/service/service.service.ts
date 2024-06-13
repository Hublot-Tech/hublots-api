import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { BulkQueryDto } from "../dto/response.dto";
import { CreateServiceDto, UpdateServiceDto } from "./dto";
import { Service } from "./schema/service.schema";

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
  ) {}

  async create(data: CreateServiceDto): Promise<Service> {
    return new this.serviceModel({
      ...data,
      updatedAt: new Date(),
      createdAt: new Date(),
    }).save();
  }

  async findOne(serviceId: string): Promise<Service> {
    return this.serviceModel.findById(serviceId).exec();
  }

  async findAll(query: BulkQueryDto): Promise<Service[]> {
    return this.serviceModel
      .find()
      .limit(query.perpage ?? 10)
      .skip(query.page ?? 1)
      .exec();
  }

  async delete(serviceId: string): Promise<void> {
    const service = await this.serviceModel.findByIdAndDelete(serviceId).exec();
    if (!service)
      throw new NotFoundException(`service with id ${serviceId} not found`);
  }

  async update(serviceId: string, data: UpdateServiceDto): Promise<Service> {
    return this.serviceModel
      .findByIdAndUpdate(
        serviceId,
        { ...data, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async addImages(serviceId: string, imageIds: string[]): Promise<Service> {
    const service = await this.serviceModel.findById(serviceId);
    if (!service)
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    service.images.push(...imageIds.map((id) => new ObjectId(id)));
    return service.save();
  }
}
