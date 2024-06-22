import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import { PaginatedResponseDataDto, ResponseDataDto } from "src/helpers/api-dto";
import { Role } from "../users/dto";
import { BlotsService } from "./blots.service";
import {
  BlotDetailsDto,
  BlotEntity,
  BlotQueryParams,
  CreateBlotDto,
} from "./dto/blot.dto";

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

  @Get(":id")
  @ApiCustomOkResponse(BlotDetailsDto)
  async findOne(
    @Param("id") blotId: string,
  ): Promise<ResponseDataDto<BlotDetailsDto>> {
    const blot = await this.blotsService.findOne(blotId);
    return new ResponseDataDto({
      data: new BlotDetailsDto(blot.toJSON()),
      message: "Successfully retrieved blot details",
      status: HttpStatus.OK,
    });
  }

  @Post("/new")
  @ApiCustomCreatedResponse(BlotEntity)
  async create(
    @Req() request: Request,
    @Body() payload: CreateBlotDto,
  ): Promise<ResponseDataDto<BlotEntity>> {
    if (!request.user.roles.includes(Role.PROVIDER)) {
      throw new ForbiddenException(
        "Operation not permitted for active user. Only provider can create blot",
      );
    }
    const newBlot = await this.blotsService.create(
      payload,
      request.user._id as string,
    );

    return new ResponseDataDto({
      data: new BlotEntity(newBlot.toJSON()),
      message: "Successfully created blot",
      status: HttpStatus.OK,
    });
  }
}
