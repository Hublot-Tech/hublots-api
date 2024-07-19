import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { ClientSession, Model } from "mongoose";
import { BulkQueryDto } from "src/helpers/api-dto";
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
  ) {}

  async create(
    { items, serviceId, ...data }: CreateOfferDto,
    createdBy: string,
  ): Promise<Offer> {
    const service = await this.serviceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    return this.execWithinTransaction(async (session) => {
      let createdItemIds: string[] = [];
      if (items.length > 0) {
        const createdItems = await this.offerItemModel.insertMany(
          items.map((item) => ({ ...item, createdBy })),
          { session },
        );
        createdItemIds = createdItems.map((_) => _.id);
      }

      return new this.offerModel({
        ...data,
        createdBy,
        serviceId,
        provider: service.provider,
        items: createdItemIds,
      }).save({ session });
    });
  }

  async bulkCreate(
    bulkData: CreateOfferDto[],
    createdBy: string,
  ): Promise<Offer[]> {
    const services = await this.serviceModel.find({
      $or: bulkData.map((_) => ({ _id: _.serviceId })),
    });
    if (services.length !== bulkData.length) {
      throw new NotFoundException(`Some service ids were not found`);
    }
    return this.execWithinTransaction(async (session) => {
      let newOffers: Offer[] = [];
      for (const { items, serviceId, ...data } of bulkData) {
        let createdItemIds: string[] = [];
        if (items.length > 0) {
          const createdItems = await this.offerItemModel.insertMany(
            items.map((item) => ({ ...item, createdBy })),
            { session },
          );
          createdItemIds = createdItems.map((_) => _.id);
          newOffers.push(
            new this.offerModel({
              ...data,
              createdBy,
              serviceId,
              provider: services.find(({ _id }) => _id === serviceId)?.provider,
              items: createdItemIds,
              createdAt: new Date(),
            }),
          );
        }
      }
      newOffers = await this.offerModel.insertMany(newOffers, { session });
      await session.commitTransaction();
      return newOffers;
    });
  }

  async findOne(serviceId: string): Promise<Offer> {
    return this.offerModel.findById(serviceId).populate("items").exec();
  }

  async findAll(query: BulkQueryDto): Promise<Offer[]> {
    return this.offerModel.find().limit(query.perpage).skip(query.page).exec();
  }

  async delete(offerId: string, deletedBy: string): Promise<void> {
    const offer = await this.offerModel.findById(offerId).exec();
    this.checkPrivileges(offer, deletedBy);

    await offer.deleteOne().exec();
  }

  async update(
    offerId: string,
    data: UpdateOfferDto,
    updatedBy: string,
  ): Promise<Service> {
    const offer = await this.offerModel.findById(offerId).exec();
    this.checkPrivileges(offer, updatedBy);

    return offer
      .updateOne({ ...data, updatedAt: new Date() }, { new: true })
      .exec();
  }

  async addItems(
    offerId: string,
    items: CreateOfferItemDto[],
    addedBy: string,
  ): Promise<Offer> {
    const offer = await this.offerModel.findById(offerId);
    this.checkPrivileges(offer, addedBy);

    return this.execWithinTransaction(async (session) => {
      const newItems = await this.offerItemModel.insertMany(
        items.map((item) => new this.offerItemModel(item)),
        { session },
      );

      offer.items.push(...newItems.map((_) => _.id));
      offer.updatedAt = new Date();
      return (await offer.save({ session })).populate("items");
    });
  }

  async removedItems(
    offerId: string,
    itemIds: string[],
    removedBy: string,
  ): Promise<Offer> {
    const offer = await this.offerModel.findById(offerId);
    this.checkPrivileges(offer, removedBy);

    return this.execWithinTransaction(async (session) => {
      await this.offerItemModel.deleteMany(
        itemIds.map((id) => new ObjectId(id)),
        { session },
      );
      offer.items = offer.items.filter(
        (item) => !itemIds.some((id) => item.toString() === id),
      );
      return (await offer.save({ session })).populate("items");
    });
  }

  private async execWithinTransaction<T>(
    callback: (session: ClientSession) => T | Promise<T>,
  ) {
    const session = await this.offerModel.startSession();
    session.startTransaction();
    try {
      return callback(session);
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Checks that the person wanting to update a document has the required priviliges
   * @param offer
   * @param actor
   */
  private checkPrivileges(offer: Offer, actor: string) {
    if (!offer) {
      throw new NotFoundException(`Offer with id ${offer._id} not found`);
    }
    if (offer.createdBy !== actor && offer.provider.toString() !== actor) {
      throw new ForbiddenException("Operation not permitted for active user");
    }
  }
}
