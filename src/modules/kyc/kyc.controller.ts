import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import { ResponseDataDto, ResponseMetadataDto } from "src/helpers/api-dto";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";
import { KYCEntity, QueryKYCDto, VerifyKYCDto } from "./dto/kyc.dto";
import { KYCService } from "./kyc.service";

@ApiTags("KYC")
@Controller("kyc")
export class KYCController {
  constructor(private kycService: KYCService) {}

  @Post("submit")
  @UseRoles(Role.CLIENT)
  @ApiCustomCreatedResponse(KYCEntity)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        kycFiles: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "Binary files to upload",
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor("kycFiles"))
  @ApiOperation({
    summary: "Submit customer KYC.",
    description: "Can only be done by the authorized user himself",
  })
  async sumbitKYC(
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ResponseDataDto<KYCEntity>> {
    const imageRefs = [];
    for (const file of files) {
      imageRefs.push(`${process.env.PUBLIC_URL}/${file.filename}`);
    }

    const kyc = await this.kycService.submit(req.user.id, imageRefs);
    return new ResponseDataDto({
      data: new KYCEntity(kyc.toJSON()),
      message: "Successfully uploaded user KYC images",
      status: HttpStatus.CREATED,
    });
  }

  @Patch(":id/status")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  @ApiOperation({
    summary: "Update kyc submission status to validated or rejected",
    description:
      "Requires authorized user to have a `admin` or `customer service` access",
  })
  async updateKYCStatus(
    @Req() req: Request,
    @Param("id") kycId: string,
    @Body() payload: VerifyKYCDto,
  ): Promise<ResponseMetadataDto> {
    await this.kycService.updateStatus(kycId, payload, req.user.id);
    return new ResponseMetadataDto({
      message: "Successfully updated user KYC images",
      status: HttpStatus.NO_CONTENT,
    });
  }

  @Get()
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiOkPaginatedResponse(KYCEntity)
  @ApiOperation({
    summary: "Fetch submitted KYCs",
    description:
      "Requires authorized user to have a `admin` or `customer service` access",
  })
  async findKYCs(@Query() query: QueryKYCDto) {
    const kycs = await this.kycService.findAll(query);
    return new ResponseDataDto({
      data: kycs.map((kyc) => new KYCEntity(kyc.toJSON())),
      message: "Successfully updated user KYC images",
      status: HttpStatus.OK,
    });
  }
}
