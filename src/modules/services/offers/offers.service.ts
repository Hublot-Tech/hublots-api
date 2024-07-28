import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { BulkQueryDto } from "src/helpers/api-dto";
import { TransactionManager } from "src/helpers/tx-manager";
import { Service } from "../schemas/service.schema";
import { CreateOfferItemDto } from "./dto/ofer-item.dto";
import { CreateOfferDto, UpdateOfferDto } from "./dto/offer.dto";
import { OfferItem } from "./schemas/offer-item.schema";
import { Offer } from "./schemas/offer.schema";

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
    @InjectModel(OfferItem.name)
    private readonly offerItemModel: Model<OfferItem>,
    private readonly txManager: TransactionManager,
  ) {}

  async create(
    { items, service: serviceId, ...data }: CreateOfferDto,
    createdBy: string,
  ): Promise<Offer> {
    const service = await this.serviceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    return this.txManager.withTransaction(async (session) => {
      let createdItemIds: string[] = [];
      if (items.length > 0) {
        const createdItems = await this.offerItemModel.insertMany(
          items.map((item) => ({ ...item, createdBy })),
          { session },
        );
        createdItemIds = createdItems.map((_) => _.id);
      }

      const offer = new this.offerModel({
        ...data,
        createdBy,
        service: serviceId,
        items: createdItemIds,
        provider: service.provider,
      });
      return await offer.save({ session });
    });
  }

  async bulkCreate(
    bulkData: CreateOfferDto[],
    createdBy: string,
  ): Promise<Offer[]> {
    const serviceId = bulkData[0]?.service;
    const service = await this.serviceModel.findOne({ id: serviceId });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    if (bulkData.find((data) => data.service !== service.id)) {
      throw new NotFoundException(`All service IDs must the identical`);
    }

    return this.txManager.withTransaction(async (session) => {
      const newOffers: Offer[] = [];
      for (const { items, ...data } of bulkData) {
        const newOffer = new this.offerModel({
          ...data,
          createdBy,
          service: serviceId,
          provider: service.provider,
        });

        if (items.length > 0) {
          await this.offerItemModel.insertMany(
            items.map((item) => ({ ...item, offer: newOffer.id, createdBy })),
            { session },
          );
        }
        newOffers.push(newOffer);
      }
      return await this.offerModel.insertMany(newOffers, { session });
    });
  }

  async findOne(offerId: string): Promise<Offer> {
    const offer = await this.offerModel
      .findById(offerId)
      .populate("service")
      .populate("provider")
      .exec();

    if (!offer) {
      throw new NotFoundException(`Offer with id ${offerId} not found`);
    }
    return offer;
  }

  async findItems(offerId: string): Promise<OfferItem[]> {
    return this.offerItemModel.find({ offer: offerId }).exec();
  }

  async findAll(query: BulkQueryDto): Promise<Offer[]> {
    return this.offerModel
      .find()
      .limit(query.perpage)
      .skip(query.perpage * (query.page - 1))
      .exec();
  }

  async delete(offerId: string, deletedBy: string): Promise<void> {
    const offer = await this.offerModel.findById(offerId).exec();
    this.checkPrivileges(offerId, offer, deletedBy);

    await offer.deleteOne().exec();
  }

  async update(
    offerId: string,
    data: UpdateOfferDto,
    updatedBy: string,
  ): Promise<Offer> {
    const offer = await this.offerModel.findById(offerId).exec();
    this.checkPrivileges(offerId, offer, updatedBy);

    await offer.updateOne({ ...data, updatedAt: new Date() }).exec();
    return offer;
  }

  async addItems(
    offerId: string,
    items: CreateOfferItemDto[],
    addedBy: string,
  ): Promise<OfferItem[]> {
    const offer = await this.offerModel.findById(offerId);
    this.checkPrivileges(offerId, offer, addedBy);

    return this.offerItemModel.insertMany(
      items.map(
        (item) =>
          new this.offerItemModel({
            ...item,
            offer: offerId,
            createdBy: addedBy,
          }),
      ),
    );
  }

  async removedItems(
    offerId: string,
    itemIds: string[],
    removedBy: string,
  ): Promise<void> {
    const offer = await this.offerModel.findById(offerId);
    this.checkPrivileges(offerId, offer, removedBy);

    await this.offerItemModel.deleteMany(itemIds.map((id) => new ObjectId(id)));
  }

  /**
   * Checks that the person wanting to update a document has the required priviliges
   * @param offer
   * @param actor
   */
  private checkPrivileges(offerId: string, offer: Offer, actor: string) {
    if (!offer) {
      throw new NotFoundException(`Offer with id ${offerId} not found`);
    }
    if (
      offer.createdBy.toString() !== actor &&
      offer.provider.toString() !== actor
    ) {
      throw new ForbiddenException("Operation not permitted for active user");
    }
  }
}
