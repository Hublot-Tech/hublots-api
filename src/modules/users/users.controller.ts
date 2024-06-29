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
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from "@nestjs/swagger";
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
import { FileUploadService } from "../files/file-upload.service";
import {
  CreateAccountDto,
  Role,
  UpdateProfileDto,
  UpdateUserDto,
  UserEntity,
} from "./dto/users.dto";
import { UsersService } from "./users.service";

@ApiBearerAuth()
@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiOkPaginatedResponse(UserEntity)
  async findAll(
    @Query() query: BulkQueryDto,
  ): Promise<PaginatedResponseDataDto<UserEntity>> {
    const users = await this.usersService.findAll(query);
    return new PaginatedResponseDataDto({
      data: users.map((user) => new UserEntity(user.toJSON())),
      page: query.page ?? 1,
      perpage: query.perpage ?? 10,
      status: HttpStatus.OK,
      message: "Successfully retrieved users",
    });
  }

  @Get("profile")
  @ApiCustomOkResponse(UserEntity)
  async getProfile(@Req() req: Request): Promise<ResponseDataDto<UserEntity>> {
    return new ResponseDataDto({
      data: new UserEntity(req.user.toJSON()),
      message: "Successfully retrieved user profile",
      status: HttpStatus.OK,
    });
  }

  @Put("profile")
  @ApiCustomOkResponse(UserEntity)
  async updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ResponseDataDto<UserEntity>> {
    const user = await this.usersService.update(req.user.id, updateProfileDto);
    return new ResponseDataDto({
      data: new UserEntity(user.toJSON()),
      message: "Successfully retrieved user",
      status: HttpStatus.OK,
    });
  }

  @Get(":id")
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiCustomOkResponse(UserEntity)
  async findOne(
    @Param("id") userId: string,
  ): Promise<ResponseDataDto<UserEntity>> {
    const user = await this.usersService.findOne(userId);

    return new ResponseDataDto({
      data: new UserEntity(user.toJSON()),
      message: "Successfully retrieved user",
      status: HttpStatus.OK,
    });
  }

  @Put(":id")
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiCustomOkResponse(UserEntity)
  async update(
    @Param("id") userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseDataDto<UserEntity>> {
    const user = await this.usersService.update(userId, updateUserDto);
    return new ResponseDataDto({
      data: new UserEntity(user.toJSON()),
      message: "Successfully retrieved user",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id")
  @UseRoles(Role.ADMIN)
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
    description: "User successfully deleted",
  })
  async delete(@Param("id") userId: string): Promise<ResponseMetadataDto> {
    await this.usersService.delete(userId);
    return new ResponseMetadataDto({
      message: "Successfully deleted user",
      status: HttpStatus.NO_CONTENT,
    });
  }

  @Put("profile/kyc-files")
  @UseRoles(Role.CLIENT)
  @ApiCustomOkResponse(UserEntity)
  @UseInterceptors(FileInterceptor("file"))
  async uploadKYCImages(
    @Req() req: Request,
    @UploadedFiles() files,
  ): Promise<ResponseDataDto<UserEntity>> {
    const imageIds = [];
    for (const file of files) {
      const image = await this.fileUploadService.uploadImage(file);
      imageIds.push(image._id);
    }

    const user = await this.usersService.addKYCImages(req.user.id, imageIds);
    return new ResponseDataDto({
      data: new UserEntity(user.toJSON()),
      message: "Successfully uploaded user KYC images",
      status: HttpStatus.OK,
    });
  }

  @Post("/new")
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiCustomCreatedResponse(UserEntity)
  async createUser(
    @Req() req: Request,
    @Body() newUser: CreateAccountDto,
  ): Promise<ResponseDataDto<UserEntity>> {
    const roles = req.user.roles;

    if (
      (!roles.includes(Role.ADMIN) && newUser.roles.includes(Role.ADMIN)) ||
      newUser.roles.includes(Role.SUPPORT)
    )
      throw new BadRequestException(
        "Only admin can create another admin or customer service account",
      );

    const user = await this.usersService.createAcount(newUser);
    return new ResponseDataDto({
      data: new UserEntity(user.toJSON()),
      message: "Successfully create user account",
      status: HttpStatus.OK,
    });
  }
}
