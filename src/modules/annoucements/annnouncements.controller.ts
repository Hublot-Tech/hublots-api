import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { AnnouncementsService } from "./announcements.service";
import {
  BulkQueryDto,
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import {
  AnnouncementDetailsDto,
  AnnouncementEntity,
  CreateAnnouncementDto,
} from "./dto/announcement.dto";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import { Request } from "express";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";
import { ApiNoContentResponse } from "@nestjs/swagger";

export class AnnouncementController {
  constructor(private readonly annonucementsService: AnnouncementsService) {}

  @Get()
  @ApiOkPaginatedResponse(AnnouncementEntity)
  async findAll(
    @Query() query: BulkQueryDto,
  ): Promise<PaginatedResponseDataDto<AnnouncementEntity>> {
    const announcements = await this.annonucementsService.findAll(query);

    return new PaginatedResponseDataDto({
      data: announcements.map(
        (announcement) => new AnnouncementEntity(announcement.toJSON()),
      ),
      page: query.page,
      perpage: query.perpage,
      status: HttpStatus.OK,
      message: "Successfully retrieved announcements",
    });
  }

  @Get(":id")
  @ApiCustomOkResponse(AnnouncementDetailsDto)
  async finOne(
    @Param("id") announcementId: string,
  ): Promise<ResponseDataDto<AnnouncementDetailsDto>> {
    const announcement =
      await this.annonucementsService.findOne(announcementId);

    return new ResponseDataDto({
      data: new AnnouncementDetailsDto(announcement.toJSON()),
      status: HttpStatus.OK,
      message: "Successfully retrieved announcement details",
    });
  }

  @Post("new")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomCreatedResponse(AnnouncementEntity)
  async create(
    @Req() request: Request,
    @Body() payload: CreateAnnouncementDto,
  ): Promise<ResponseDataDto<AnnouncementEntity>> {
    const announcement = await this.annonucementsService.create(
      payload,
      request.user._id as string,
    );

    return new ResponseDataDto({
      data: new AnnouncementEntity(announcement.toJSON()),
      status: HttpStatus.CREATED,
      message: "Successfully created announcement",
    });
  }

  @Put(":id")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomCreatedResponse(AnnouncementEntity)
  async update(
    @Req() request: Request,
    @Param("id") announcementId: string,
    @Body() payload: CreateAnnouncementDto,
  ): Promise<ResponseDataDto<AnnouncementEntity>> {
    const announcement = await this.annonucementsService.update(
      announcementId,
      payload,
      request.user._id as string,
    );

    return new ResponseDataDto({
      data: new AnnouncementEntity(announcement.toJSON()),
      status: HttpStatus.OK,
      message: "Successfully updated announcement",
    });
  }

  @Delete(":id")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async delete(
    @Req() request: Request,
    @Param("id") announcementId: string,
  ): Promise<ResponseMetadataDto> {
    await this.annonucementsService.delete(
      announcementId,
      request.user._id as string,
    );

    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully deleted announcement",
    });
  }
}
