import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBadGatewayResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { Public, UseRoles } from "../auth/decorator/auth.decorator";
import { BulkQueryDto, ResponseMetadataDto } from "../dto";
import { Role } from "../users/dto";
import {
  AddServiceResponseDto,
  CreateServiceDto,
  GetAllServiceResponseDto,
  GetOneServiceResponseDto,
  ServiceDto,
} from "./dto/service.dto";
import { ServiceService } from "./service.service";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { FileUploadService } from "../files/file-upload.service";

@ApiTags("Services")
@Controller("services")
export class ServiceController {
  constructor(
    private serviceService: ServiceService,
    private fileUploadService: FileUploadService,
  ) {}

  @Get()
  @Public()
  @ApiOkResponse({
    type: GetAllServiceResponseDto,
    description: "list of successfully loaded services",
  })
  async findAll(
    @Query() query: BulkQueryDto,
  ): Promise<GetAllServiceResponseDto> {
    const services = await this.serviceService.findAll(query);
    return new GetAllServiceResponseDto({
      data: services.map((service) => new ServiceDto(service.toJSON())),
      page: query.page ?? 1,
      perpage: query.perpage ?? 10,
      status: HttpStatus.OK,
      message: "Successfully retrieved services",
    });
  }

  @Post("new")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @UseRoles(Role.PROVIDER, Role.SUPPORT)
  @ApiCreatedResponse({
    type: AddServiceResponseDto,
    description: "Service Created Sucessfully",
  })
  async create(
    @UploadedFile() file,
    @Req() request: Request,
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<AddServiceResponseDto> {
    if (
      !createServiceDto.provider &&
      !request.user.roles.includes(Role.PROVIDER)
    ) {
      throw new BadRequestException("provider must be provider");
    }

    const newService = {
      ...createServiceDto,
      provider: request.user.roles.includes(Role.PROVIDER)
        ? request.user.id
        : createServiceDto.provider,
    };
    if (!createServiceDto.mainImageId && file) {
      const image = await this.fileUploadService.uploadImage(file);
      newService.mainImageId = image.id;
    }

    const service = await this.serviceService.create(newService);

    return new AddServiceResponseDto({
      data: new ServiceDto(service.toJSON()),
      message: "Service Created Sucessfully",
      status: HttpStatus.CREATED,
    });
  }

  @Get(":id")
  @ApiOkResponse({
    type: GetOneServiceResponseDto,
    description: "Service information successfully retrieved",
  })
  @ApiNotFoundResponse({ description: "Service not found" })
  @ApiBadGatewayResponse({ description: "Invalid service ID" })
  async findOne(
    @Param("id") serviceId: string,
  ): Promise<GetOneServiceResponseDto> {
    const service = await this.serviceService.findOne(serviceId); // Call the findOne method with the serviceId parameter
    return new GetOneServiceResponseDto({
      data: new ServiceDto(service.toJSON()),
      message: "Successfully retrieved service",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id")
  @UseRoles(Role.PROVIDER)
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
    description: "Service successfully deleted",
  })
  async delete(@Param("id") serviceId: string): Promise<ResponseMetadataDto> {
    await this.serviceService.delete(serviceId);
    return new ResponseMetadataDto({
      status: HttpStatus.NO_CONTENT,
      message: "Service successfully deleted",
    });
  }

  @Put(":service_id/images")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("files"))
  @UseRoles(Role.PROVIDER, Role.SUPPORT)
  @ApiCreatedResponse({
    type: AddServiceResponseDto,
    description: "Service Created Sucessfully",
  })
  async uploadImages(
    @UploadedFiles() files,
    @Param("service_id") serviceId: string,
  ) {
    if (!Array.isArray(files)) {
      throw new BadRequestException("Except an array of files");
    }

    const imageIds: string[] = [];
    for (const file of files) {
      const image = await this.fileUploadService.uploadImage(file);
      imageIds.push(image.id);
    }

    const service = await this.serviceService.addImages(serviceId, imageIds);
    return new AddServiceResponseDto({
      data: new ServiceDto(service.toJSON()),
      message: "Service Created Sucessfully",
      status: HttpStatus.CREATED,
    });
  }
}
