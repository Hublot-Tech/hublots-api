import { Controller, Get, HttpStatus } from "@nestjs/common";
import { PriceSettingsService } from "./price-settings.service";
import { PaginatedResponseDataDto } from "src/helpers/api-dto";
import { PriceSettingsEntity } from "./dto/price-settings.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiOkPaginatedResponse } from "src/helpers/api-decorator";

@ApiTags("Price settings")
@Controller("price-settings")
export class PriceSettingsController {
  constructor(private priceSettingsService: PriceSettingsService) {}

  @Get()
  @ApiOkPaginatedResponse(PriceSettingsEntity)
  @ApiOperation({ summary: "Fetch platform price settings" })
  async findAll(): Promise<PaginatedResponseDataDto<PriceSettingsEntity>> {
    const priceSettings = await this.priceSettingsService.findAll();
    return new PaginatedResponseDataDto({
      page: 1,
      perpage: priceSettings.length,
      status: HttpStatus.OK,
      message: "Successfully retrieved price settings",
      data: priceSettings.map(
        (priceSetting) => new PriceSettingsEntity(priceSetting.toJSON()),
      ),
    });
  }
}
