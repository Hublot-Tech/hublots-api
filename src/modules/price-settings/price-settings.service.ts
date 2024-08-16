import { InjectModel } from "@nestjs/mongoose";
import {
  PriceSettings,
  PriceSettingsNames,
} from "./schemas/price-settings.schema";
import { Model } from "mongoose";
import { CreatePriceSettingsDto } from "./dto/price-settings.dto";
import { ConflictException, Logger, NotFoundException } from "@nestjs/common";
import { User } from "../users/schemas/user.schema";

export class PriceSettingsService {
  private readonly logger = new Logger(PriceSettingsService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(PriceSettings.name)
    private readonly priceSettingsModel: Model<PriceSettings>,
  ) {
    this.userModel
      .findOne({
        email: process.env.ADMIN_EMAIL,
      })
      .exec()
      .then((user) => {
        //seed price settings
        this.seedPriceSettings(
          [
            { name: PriceSettingsNames.ANNOUNCEMENT },
            { name: PriceSettingsNames.COMMISSION },
            { name: PriceSettingsNames.CUSTOMER_SUPPORT },
            { name: PriceSettingsNames.EXTRA_SERVICE },
            { name: PriceSettingsNames.EXTRA_SERVICE_OFFER },
            { name: PriceSettingsNames.SPONSORED_SERVICE },
          ],
          user.id,
        );
        this.logger.debug("Price settings successfully initialized!");
      });
  }

  async findOne(settingsName: PriceSettingsNames): Promise<PriceSettings> {
    return this.priceSettingsModel.findOne({ name: settingsName }).exec();
  }

  async create(
    payload: CreatePriceSettingsDto,
    createdBy: string,
  ): Promise<PriceSettings> {
    const settings = await this.priceSettingsModel
      .findOne({ name: payload.name })
      .exec();

    if (settings) {
      throw new ConflictException(
        `Price settings for ${payload.name} already exist`,
      );
    }

    return this.priceSettingsModel.create({ ...payload, createdBy });
  }

  async update(payload: CreatePriceSettingsDto) {
    const settings = await this.priceSettingsModel
      .findOne({ name: payload.name })
      .exec();

    if (!settings) {
      throw new NotFoundException(`Price settings ${payload.name} not found`);
    }

    settings.updateOne({ ...payload });
  }

  private async seedPriceSettings(
    settings: CreatePriceSettingsDto[],
    createdBy: string,
  ) {
    const settingsCount = await this.priceSettingsModel.countDocuments().exec();
    if (settingsCount === 0) {
      await this.priceSettingsModel.insertMany(
        settings.map((setting) => ({ ...setting, createdBy })),
      );
      this.logger.debug("Successfully created price settings");
    }
  }
}
