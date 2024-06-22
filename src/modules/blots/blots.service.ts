import {
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { ClientSession, Model } from "mongoose";
import { OfferItem } from "../services/offers/schema/offer-item.schema";
import {
  BlotQueryParams,
  CreateBlotDto,
  CreateBlotOptionDto,
  UpdateBlotDto,
} from "./dto/blot.dto";
import { BlotOption } from "./schema/blot-option.schema";
import { Blot, BlotStatus } from "./schema/blot.schema";

@Injectable()
export class BlotsService {
  constructor(
    @InjectModel(Blot.name) private readonly blotModel: Model<Blot>,
    @InjectModel(BlotOption.name)
    private readonly blotOptionModel: Model<BlotOption>,
    @InjectModel(OfferItem.name) private readonly itemModel: Model<OfferItem>,
  ) {}

  async create(
    { options, ...payload }: CreateBlotDto,
    createdBy: string,
  ): Promise<Blot> {
    return this.execWithinTransaction(async (session) => {
      const newBlotOptions = await this.prepareBlotOptions(options, session);
      const createdOptions = await this.blotOptionModel.insertMany(
        newBlotOptions,
        { session },
      );
      return new this.blotModel({
        ...payload,
        createdBy,
        updatedAt: new Date(),
        options: createdOptions.map((_) => _._id),
      }).save({ session });
    });
  }

  private async prepareBlotOptions(options: CreateBlotOptionDto[], session) {
    const newBlotOptions: BlotOption[] = [];
    for (const {
      item: { id, ...newItem },
      quantity,
    } of options) {
      let item = id;
      if (item) {
        const createdItem = await new this.itemModel(newItem).save({
          session,
        });
        item = createdItem._id as string;
      }
      newBlotOptions.push(
        new this.blotOptionModel({
          item: new ObjectId(item),
          updatedAt: new Date(),
          quantity,
        }),
      );
    }
    return newBlotOptions;
  }

  async findOne(blotId: string): Promise<Blot> {
    return this.blotModel.findById(blotId).populate("options").exec();
  }

  async findAll(query: BlotQueryParams, activeUser?: string): Promise<Blot[]> {
    return this.blotModel
      .find({
        ...query,
        $or: [{ createdBy: activeUser }, { consumer: activeUser }],
      })
      .limit(query.perpage ?? 10)
      .skip(query.page ?? 1)
      .populate("options")
      .exec();
  }

  async delete(blotId: string, deletedBy: string): Promise<void> {
    const blot = await this.blotModel.findById(blotId).exec();
    this.checkPrivileges(blot, deletedBy);

    await blot.deleteOne().exec();
  }

  async update(
    orderId: string,
    data: UpdateBlotDto,
    updatedBy: string,
  ): Promise<Blot> {
    const blot = await this.blotModel.findById(orderId).exec();
    this.checkPrivileges(blot, updatedBy);

    return this.execWithinTransaction(async (session) => {
      let options = blot.options;
      if (data.options) {
        const newBlotOptions = await this.prepareBlotOptions(
          data.options,
          session,
        );
        const createdOptions = await this.blotOptionModel.insertMany(
          newBlotOptions,
          { session },
        );
        options = createdOptions.map(({ _id }) => new ObjectId(_id as string));
      }
      return blot
        .updateOne({ ...data, options, updatedAt: new Date() }, { new: true })
        .exec();
    });
  }

  async addOptions(
    blotId: string,
    options: CreateBlotOptionDto[],
    addedBy: string,
  ): Promise<Blot> {
    const blot = await this.blotModel.findById(blotId);
    if (!blot) throw new NotFoundException(`Blot with id ${blotId} not found`);
    this.checkPrivileges(blot, addedBy);

    return this.execWithinTransaction(async (session) => {
      const newBlotOptions = await this.prepareBlotOptions(options, session);
      const createdOptions = await this.blotOptionModel.insertMany(
        newBlotOptions,
        { session },
      );
      blot.options.push(
        ...createdOptions.map(({ _id }) => new ObjectId(_id as string)),
      );
      return blot.save({ session });
    });
  }

  async removeOptions(blotId: string, optionIds: string[], deletedBy: string) {
    const blot = await this.blotModel.findById(blotId);
    if (!blot) throw new NotFoundException(`Blot with id ${blotId} not found`);
    this.checkPrivileges(blot, deletedBy);

    blot.options = blot.options.filter(
      (_) => !optionIds.includes(_._id.toString()),
    );
    return blot.save();
  }

  private async execWithinTransaction<T>(
    callback: (session: ClientSession) => T | Promise<T>,
  ) {
    const session = await this.blotModel.startSession();
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
  private checkPrivileges(order: Blot, actor: string) {
    if (!order) {
      throw new NotFoundException(`Blot with id ${order._id} not found`);
    }

    if (order.createdBy !== actor) {
      throw new ForbiddenException(`Operation not permitted for active user`);
    }

    if (order.status !== BlotStatus.CREATED) {
      throw new NotAcceptableException(
        `Operation not permitted on Blot with status ${order.status}`,
      );
    }
  }
}
