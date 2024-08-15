import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { ClientSession, Model } from "mongoose";
import { OfferItem } from "../services/offers/schemas/offer-item.schema";
import {
  BlotQueryParams,
  CreateBlotDto,
  CreateBlotOptionDto,
  UpdateBlotDto,
} from "./dto/blot.dto";
import { BlotOption } from "./schemas/blot-option.schema";
import { Blot, BlotStatus } from "./schemas/blot.schema";
import { TransactionManager } from "src/helpers/tx-manager";

@Injectable()
export class BlotsService {
  constructor(
    @InjectModel(Blot.name) private readonly blotModel: Model<Blot>,
    @InjectModel(BlotOption.name)
    private readonly blotOptionModel: Model<BlotOption>,
    @InjectModel(OfferItem.name) private readonly itemModel: Model<OfferItem>,
    private readonly txManager: TransactionManager,
  ) {}

  async create(
    { options, ...payload }: CreateBlotDto,
    provider: string,
  ): Promise<Blot> {
    return this.txManager.withTransaction(async (session) => {
      const newBlotOptions = await this.prepareBlotOptions(options, session);
      const createdOptions = await this.blotOptionModel.insertMany(
        newBlotOptions,
        { session },
      );
      return new this.blotModel({
        ...payload,
        provider,
        options: createdOptions.map((_) => _._id),
      }).save({ session });
    });
  }

  private async prepareBlotOptions(
    options: CreateBlotOptionDto[],
    session: ClientSession,
  ) {
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
        item = createdItem.id;
      }
      newBlotOptions.push(
        new this.blotOptionModel({
          item: new ObjectId(item),
          quantity,
        }),
      );
    }
    return newBlotOptions;
  }

  async findOne(blotId: string, userId: string): Promise<Blot> {
    const blot = this.blotModel
      .findOne({
        id: blotId,
        $or: [{ provider: userId }, { consumer: userId }],
      })
      .populate("options")
      .populate("offer")
      .populate("consumer")
      .populate("provider")
      .exec();

    if (!blot) {
      throw new NotFoundException(`Blot with id ${blotId} not found`);
    }
    return blot;
  }

  async findAll(query: BlotQueryParams, activeUser?: string): Promise<Blot[]> {
    return this.blotModel
      .find({
        status: query.status,
        provider: query.provider,
        consumer: query.consumer,
        $or: [{ provider: activeUser }, { consumer: activeUser }],
      })
      .limit(query.perpage)
      .skip(query.perpage * (query.page - 1))
      .populate("options")
      .exec();
  }

  async cancel(blotId: string, deletedBy: string): Promise<void> {
    const blot = await this.blotModel.findById(blotId).exec();
    this.checkPrivileges(blotId, blot, deletedBy);

    if ([BlotStatus.FINALIZED, BlotStatus.STARTED_WORK].includes(blot.status)) {
      throw new UnprocessableEntityException(
        `Blot cannot be cancelled if work was started or finalized`,
      );
    }

    await blot.updateOne({ status: BlotStatus.CANCELLED }).exec();
  }

  async update(
    blotId: string,
    data: UpdateBlotDto,
    updatedBy: string,
  ): Promise<Blot> {
    const blot = await this.blotModel.findById(blotId).exec();
    this.checkPrivileges(blotId, blot, updatedBy);

    let allowedStatuses = [];
    switch (data.status) {
      case BlotStatus.ACCEPTED:
        allowedStatuses = [BlotStatus.CREATED];
        break;
      case BlotStatus.GOT_IN_TOUCH:
        allowedStatuses = [BlotStatus.ACCEPTED];
        break;
      case BlotStatus.STARTED_WORK:
        allowedStatuses = [BlotStatus.ACCEPTED, BlotStatus.GOT_IN_TOUCH];
        break;
      case BlotStatus.FINALIZED:
        allowedStatuses = [
          BlotStatus.ACCEPTED,
          BlotStatus.GOT_IN_TOUCH,
          BlotStatus.STARTED_WORK,
        ];
    }
    if (!allowedStatuses.includes(blot.status)) {
      throw new UnprocessableEntityException(
        `Blot status can only be update to ${blot.status} if found in one of the following states: ${allowedStatuses}`,
      );
    }

    await blot.updateOne({ ...data, updatedAt: new Date() }).exec();
    return this.blotModel.findById(blotId).exec();
  }

  async addOptions(
    blotId: string,
    options: CreateBlotOptionDto[],
    addedBy: string,
  ): Promise<Blot> {
    const blot = await this.blotModel.findById(blotId);
    if (!blot) throw new NotFoundException(`Blot with id ${blotId} not found`);
    this.checkPrivileges(blotId, blot, addedBy);

    if (blot.status !== BlotStatus.CREATED) {
      throw new UnprocessableEntityException(
        `Cannot modify Blot options after it was accepted`,
      );
    }

    return this.txManager.withTransaction(async (session) => {
      const newBlotOptions = await this.prepareBlotOptions(options, session);
      const createdOptions = await this.blotOptionModel.insertMany(
        newBlotOptions,
        { session },
      );
      blot.options.push(
        ...createdOptions.map((opt) => new ObjectId(opt.id as string)),
      );
      return await blot.save({ session });
    });
  }

  async removeOptions(blotId: string, optionIds: string[], deletedBy: string) {
    const blot = await this.blotModel.findById(blotId);
    if (!blot) throw new NotFoundException(`Blot with id ${blotId} not found`);
    this.checkPrivileges(blotId, blot, deletedBy);

    if (blot.status !== BlotStatus.CREATED) {
      throw new UnprocessableEntityException(
        `Cannot modify Blot options after it was accepted`,
      );
    }

    blot.options = blot.options.filter(
      (_) => !optionIds.includes(_._id.toString()),
    );
    return blot.save();
  }

  /**
   * Checks that the person wanting to update a document has the required priviliges
   * @param offer
   * @param actor
   */
  private checkPrivileges(blotId: string, blot: Blot, actor: string) {
    if (!blot) {
      throw new NotFoundException(`Blot with id ${blotId} not found`);
    }

    if (
      blot.provider.toString() !== actor &&
      blot.consumer.toString() !== actor
    ) {
      throw new ForbiddenException(`Operation not permitted for active user`);
    }
  }
}
