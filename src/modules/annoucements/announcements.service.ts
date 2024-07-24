import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Announcement } from "./schemas/announcement.schema";
import { Model } from "mongoose";
import { BulkQueryDto } from "src/helpers/api-dto";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./dto/announcement.dto";

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<Announcement>,
  ) {}

  async create(
    data: CreateAnnouncementDto,
    createdBy: string,
  ): Promise<Announcement> {
    //FIXME: retrieve amount paid using data.paymentId
    const amountPaid = 0;

    return new this.announcementModel({
      ...data,
      createdBy,
      amountPaid,
      provider: data.provider ?? createdBy,
    }).save();
  }

  async findOne(announcementId: string): Promise<Announcement> {
    return this.announcementModel
      .findById(announcementId)
      .populate("provider")
      .exec();
  }

  async findAll(query: BulkQueryDto): Promise<Announcement[]> {
    return this.announcementModel
      .find()
      .limit(query.perpage)
      .skip(query.page)
      .exec();
  }

  async delete(announcementId: string, deletedBy: string): Promise<void> {
    const announcement = await this.announcementModel
      .findById(announcementId)
      .exec();
    this.checkPrivileges(announcement, deletedBy);

    await announcement.deleteOne().exec();
  }

  async update(
    announcementId: string,
    data: UpdateAnnouncementDto,
    updatedBy: string,
  ): Promise<Announcement> {
    const announcement = await this.announcementModel
      .findById(announcementId)
      .exec();
    this.checkPrivileges(announcement, updatedBy);

    await announcement
      .updateOne({ ...data, updatedAt: new Date() }, { new: true })
      .exec();
    return announcement;
  }

  /**
   * Checks that the person wanting to update a document has the required priviliges
   * @param offer
   * @param actor
   */
  private checkPrivileges(announcement: Announcement, actor: string) {
    if (!announcement) {
      throw new NotFoundException(
        `Announcement with id ${announcement._id} not found`,
      );
    }
    if (
      announcement.createdBy.toString() !== actor &&
      announcement.provider.toString() !== actor
    ) {
      throw new ForbiddenException("Operation not permitted for active user");
    }
  }
}
