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
  UnprocessableEntityException,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
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
  BulkQueryDto,
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import { UseRoles } from "../auth/decorator/auth.decorator";
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
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiOkPaginatedResponse(UserEntity)
  @ApiOperation({
    summary: "Fetch all users.",
    description:
      "Requires authorized user to have an `admin` or `support` (customer support) access",
  })
  async findAll(
    @Query() query: BulkQueryDto,
  ): Promise<PaginatedResponseDataDto<UserEntity>> {
    const users = await this.usersService.findAll(query);
    return new PaginatedResponseDataDto({
      data: users.map((user) => new UserEntity(user.toJSON())),
      page: query.page,
      perpage: query.perpage,
      status: HttpStatus.OK,
      message: "Successfully retrieved users",
    });
  }

  @Get("profile")
  @ApiCustomOkResponse(UserEntity)
  @ApiOperation({ summary: "Fetch authorized user profile" })
  async getProfile(@Req() req: Request): Promise<ResponseDataDto<UserEntity>> {
    return new ResponseDataDto({
      data: new UserEntity(req.user.toJSON()),
      message: "Successfully retrieved user profile",
      status: HttpStatus.OK,
    });
  }

  @Put("profile")
  @ApiCustomOkResponse(UserEntity)
  @ApiOperation({ summary: "Update authorized user profile." })
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
  @ApiOperation({
    summary: "Fetch user details.",
    description:
      "Requires authorized user to have an `admin` or `support` (customer support) access",
  })
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
  @ApiOperation({
    summary: "Update user information.",
    description:
      "Requires authorized user to have an `admin` or `support` (customer support) access",
  })
  async update(
    @Param("id") userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseDataDto<UserEntity>> {
    if (
      !updateUserDto.roles.find((role) =>
        [Role.PROVIDER, Role.PARTNER].includes(role),
      )
    ) {
      throw new UnprocessableEntityException(
        "Please use the allocate endpoints to assign provider and pathner roles to a user",
      );
    }

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
  @ApiOperation({
    summary: "Delete a user.",
    description: "Requires authorized user to have a `admin` access",
  })
  async delete(@Param("id") userId: string): Promise<ResponseMetadataDto> {
    await this.usersService.delete(userId);
    return new ResponseMetadataDto({
      message: "Successfully deleted user",
      status: HttpStatus.NO_CONTENT,
    });
  }

  @Post("kyc-images")
  @UseRoles(Role.CLIENT)
  @ApiCustomOkResponse(UserEntity)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        kycFiles: {
          type: "array",
          format: "binary",
          description: "Array of Identity files to be verified",
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor("kycFiles"))
  @ApiOperation({ summary: "Upload KYC images." })
  async uploadKYCImages(
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ResponseDataDto<UserEntity>> {
    const imageRefs = [];
    for (const file of files) {
      imageRefs.push(`${process.env.PUBLIC_URL}/${file.filename}`);
    }

    const user = await this.usersService.addKYCImages(req.user.id, imageRefs);
    return new ResponseDataDto({
      data: new UserEntity(user.toJSON()),
      message: "Successfully uploaded user KYC images",
      status: HttpStatus.OK,
    });
  }

  @Post("/new")
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiCustomCreatedResponse(UserEntity)
  @ApiOperation({
    summary: "Create a new user.",
    description:
      "Requires authorized user to have an `admin` or `support` (customer support) access",
  })
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
