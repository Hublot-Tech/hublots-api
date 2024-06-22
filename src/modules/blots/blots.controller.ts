import { Controller, Get, HttpStatus, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ApiOkPaginatedResponse } from "src/helpers/api-decorator";
import { PaginatedResponseDataDto } from "src/helpers/api-dto";
import { Role } from "../users/dto";
import { BlotsService } from "./blots.service";
import { BlotEntity, BlotQueryParams } from "./dto/blot.dto";

@ApiTags("Blots")
@Controller("blots")
export class BlotsController {
  constructor(private blotsService: BlotsService) {}

  @Get()
  @ApiOkPaginatedResponse(BlotEntity)
  async finAll(
    @Req() request: Request,
    @Query() query: BlotQueryParams,
  ): Promise<PaginatedResponseDataDto<BlotEntity>> {
    const activeUser = [Role.CLIENT, Role.PROVIDER].some((role) =>
      request.user.roles.includes(role),
    )
      ? (request.user._id as string)
      : undefined;
    const blots = await this.blotsService.findAll(query, activeUser);

    return new PaginatedResponseDataDto({
      data: blots.map((blot) => new BlotEntity(blot.toJSON())),
      page: query.page ?? 1,
      perpage: query.perpage ?? 10,
      status: HttpStatus.OK,
      message: "Successfully retrieved blots",
    });
  }
}
