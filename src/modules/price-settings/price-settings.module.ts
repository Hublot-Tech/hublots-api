import { Module } from "@nestjs/common";
import { PriceSettingsService } from "./price-settings.service";
import { MongooseModule } from "@nestjs/mongoose";
import {
  PriceSettings,
  PriceSettingsSchema,
} from "./schemas/price-settings.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PriceSettings.name, schema: PriceSettingsSchema },
    ]),
  ],
  providers: [PriceSettingsService],
  exports: [PriceSettingsService],
})
export class PriceSettingsModule {}
