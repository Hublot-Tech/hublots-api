import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiOkPaginatedResponse } from "src/helpers/api-decorator";
import { PaginatedResponseDataDto } from "src/helpers/api-dto";
import { CreatePlaceDto } from "./dto/place.dto";
import { PlacesService } from "./places.service";

@ApiTags("Places")
@Controller("places")
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @Get("search")
  @ApiOperation({
    summary: "Search for a place.",
    description:
      "Use this for autocomplete text fields by polling every 03 to 05 seconds",
  })
  @ApiOkPaginatedResponse(CreatePlaceDto)
  async findPlaces(
    @Query("keywords") keywords: string,
  ): Promise<PaginatedResponseDataDto<CreatePlaceDto>> {
    const places = await this.placesService.search(keywords);
    return new PaginatedResponseDataDto({
      page: 1,
      data: places,
      message: "Successfully retrieved searched places",
      perpage: places.length,
      status: HttpStatus.OK,
    });
  }
}
