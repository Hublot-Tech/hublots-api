import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BulkQueryDto } from "../../helpers/api-dto";
import { CreateServiceDto, UpdateServiceDto } from "./dto";
import { Service } from "./schemas/service.schema";

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
  ) {}

  async create(data: CreateServiceDto, createdBy: string): Promise<Service> {
    return new this.serviceModel({
      ...data,
      createdBy,
      provider: data.provider ?? createdBy,
    }).save();
  }

  async findOne(serviceId: string): Promise<Service> {
    return this.serviceModel
      .findById(serviceId)
      .populate("offers")
      .populate("provider")
      .exec();
  }

  async findAll(query: BulkQueryDto): Promise<Service[]> {
    return this.serviceModel
      .find()
      .limit(query.perpage)
      .skip(query.page)
      .exec();
  }

  async delete(serviceId: string, deletedBy: string): Promise<void> {
    const service = await this.serviceModel.findById(serviceId).exec();
    this.checkPrivileges(service, deletedBy);

    await service.deleteOne().exec();
  }

  async update(
    serviceId: string,
    data: UpdateServiceDto,
    updatedBy: string,
  ): Promise<Service> {
    const service = await this.serviceModel.findById(serviceId).exec();
    this.checkPrivileges(service, updatedBy);

    return service
      .updateOne({ ...data, updatedAt: new Date() }, { new: true })
      .exec();
  }

  async addImages(serviceId: string, imageRefs: string[]): Promise<Service> {
    const service = await this.serviceModel.findById(serviceId);
    if (!service)
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    service.imageRefs.push(...imageRefs);
    return service.save();
  }

  /**
   * Checks that the person wanting to update a document has the required priviliges
   * @param offer
   * @param actor
   */
  private checkPrivileges(service: Service, actor: string) {
    if (!service) {
      throw new NotFoundException(`Service with id ${service._id} not found`);
    }
    if (
      service.createdBy.toString() !== actor &&
      service.provider.toString() !== actor
    ) {
      throw new ForbiddenException("Operation not permitted for active user");
    }
  }
}
