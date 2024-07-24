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
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import {
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import { MongoIdPipe } from "src/helpers/custom-pipes";
import { Public, UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";
import {
  CreateServiceDto,
  ServiceDetailsDto,
  ServiceEntity,
  ServiceParamsDto,
  UpdateServiceDto,
} from "./dto/service.dto";
import { ServicesService } from "./services.service";

@ApiBearerAuth()
@ApiTags("Services")
@Controller("services")
export class ServicesController {
  constructor(private serviceService: ServicesService) {}

  @Get()
  @Public()
  @ApiOkPaginatedResponse(ServiceEntity)
  @ApiOperation({ summary: "Fetch all services." })
  async findAll(
    @Query() query: ServiceParamsDto,
  ): Promise<PaginatedResponseDataDto<ServiceEntity>> {
    const services = await this.serviceService.findAll(query);
    return new PaginatedResponseDataDto({
      data: services.map((service) => new ServiceEntity(service.toJSON())),
      page: query.page,
      perpage: query.perpage,
      status: HttpStatus.OK,
      message: "Successfully retrieved services",
    });
  }

  @Post("new")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @UseRoles(Role.PROVIDER, Role.SUPPORT)
  @ApiCustomCreatedResponse(ServiceEntity)
  @ApiBody({ type: CreateServiceDto })
  @ApiOperation({
    summary: "Create new service.",
    description:
      "Requires authorized user to have a `provider` or `support` (customer support) access",
  })
  async create(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ResponseDataDto<ServiceEntity>> {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    if (
      !createServiceDto.provider &&
      !request.user.roles.includes(Role.PROVIDER)
    ) {
      throw new BadRequestException("provider is required");
    }

    const newService: CreateServiceDto = {
      ...createServiceDto,
      mainImageRef: `${process.env.PUBLIC_URL}/${file.filename}`,
      provider: request.user.roles.includes(Role.PROVIDER)
        ? request.user.id
        : createServiceDto.provider,
    };

    const service = await this.serviceService.create(
      newService,
      request.user.id,
    );

    return new ResponseDataDto({
      data: new ServiceEntity(service.toJSON()),
      message: "Service Created Sucessfully",
      status: HttpStatus.CREATED,
    });
  }

  @Get(":id")
  @ApiCustomOkResponse(ServiceDetailsDto)
  @ApiOperation({ summary: "Fetch service details." })
  async findOne(
    @Param("id", MongoIdPipe) serviceId: string,
  ): Promise<ResponseDataDto<ServiceDetailsDto>> {
    const service = await this.serviceService.findOne(serviceId); // Call the findOne method with the serviceId parameter
    return new ResponseDataDto({
      data: new ServiceDetailsDto(service.toJSON()),
      message: "Successfully retrieved service",
      status: HttpStatus.OK,
    });
  }

  @Put(":id")
  @ApiCustomOkResponse(ServiceDetailsDto)
  @ApiOperation({
    summary: "Update service.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the service",
  })
  async update(
    @Req() request: Request,
    @Body() payload: UpdateServiceDto,
    @Param("id", MongoIdPipe) serviceId: string,
  ): Promise<ResponseDataDto<ServiceDetailsDto>> {
    const service = await this.serviceService.update(
      serviceId,
      payload,
      request.user.id,
    );
    return new ResponseDataDto({
      data: new ServiceDetailsDto(service.toJSON()),
      message: "Successfully updated service",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id")
  @UseRoles(Role.PROVIDER, Role.SUPPORT)
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
    description: "Service successfully deleted",
  })
  @ApiOperation({
    summary: "Delete a service.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the service",
  })
  async delete(
    @Req() request: Request,
    @Param("id", MongoIdPipe) serviceId: string,
  ): Promise<ResponseMetadataDto> {
    await this.serviceService.delete(serviceId, request.user.id);
    return new ResponseMetadataDto({
      status: HttpStatus.NO_CONTENT,
      message: "Service successfully deleted",
    });
  }

  @Post(":id/images")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("images"))
  @UseRoles(Role.PROVIDER, Role.SUPPORT)
  @ApiCustomOkResponse(ServiceEntity)
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        images: {
          type: "array",
          format: "binary",
          description: "Array of service images binary files",
        },
      },
    },
  })
  @ApiOperation({
    summary: "Upload service images.",
    description:
      "Requires authorized user to have a `provider` or `support` (customer support) role",
  })
  async uploadImages(
    @Req() request: Request,
    @Param("id", MongoIdPipe) serviceId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ResponseDataDto<ServiceEntity>> {
    if (!files || files.length === 0) {
      throw new BadRequestException("Image files are required");
    }

    const imageRefs: string[] = [];
    for (const file of files) {
      imageRefs.push(`${process.env.PUBLIC_URL}/${file.filename}`);
    }

    const service = await this.serviceService.addImages(
      serviceId,
      imageRefs,
      request.user.id,
    );
    return new ResponseDataDto({
      data: new ServiceEntity(service.toJSON()),
      message: "Sucessfully uploaded service images",
      status: HttpStatus.OK,
    });
  }
}
