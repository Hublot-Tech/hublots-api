import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiNoContentResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import {
  BulkQueryDto,
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";
import { AnnouncementsService } from "./announcements.service";
import {
  AnnouncementDetailsDto,
  AnnouncementEntity,
  CreateAnnouncementDto,
} from "./dto/announcement.dto";
import { MongoIdPipe } from "src/helpers/custom-pipes";

@ApiTags("Announcements")
@Controller("announcements")
export class AnnouncementsController {
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
    @Param("id", MongoIdPipe) announcementId: string,
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
  @UseInterceptors(FileInterceptor("flyer"))
  async create(
    @Req() request: Request,
    @Body() payload: CreateAnnouncementDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDataDto<AnnouncementEntity>> {
    const announcement = await this.annonucementsService.create(
      { ...payload, imageRef: `${process.env.PUBLIC_URL}/${file.filename}` },
      request.user.id,
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
    @Param("id", MongoIdPipe) announcementId: string,
    @Body() payload: CreateAnnouncementDto,
  ): Promise<ResponseDataDto<AnnouncementEntity>> {
    const announcement = await this.annonucementsService.update(
      announcementId,
      payload,
      request.user.id,
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
    @Param("id", MongoIdPipe) announcementId: string,
  ): Promise<ResponseMetadataDto> {
    await this.annonucementsService.delete(announcementId, request.user.id);

    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully deleted announcement",
    });
  }
}
