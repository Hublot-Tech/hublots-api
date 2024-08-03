import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ApiCustomOkResponse } from "src/helpers/api-decorator";
import { ResponseDataDto } from "src/helpers/api-dto";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";
import { KYCEntity, VerifyKYCDto } from "./dto/kyc.dto";
import { KYCService } from "./kyc.service";

@ApiTags("KYC")
@Controller("kyc")
export class KYCController {
  constructor(private kycService: KYCService) {}

  @Post("submit")
  @UseRoles(Role.CLIENT)
  @ApiCustomOkResponse(KYCEntity)
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
      status: HttpStatus.OK,
    });
  }

  @Patch(":id/status")
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiOperation({
    summary: "Update kyc submission status to validated or rejected",
    description:
      "Requires authorized user to have a `admin` or `customer service` access",
  })
  async updateKYCStatus(
    @Req() req: Request,
    @Param("id") kycId: string,
    @Body() payload: VerifyKYCDto,
  ): Promise<ResponseDataDto<KYCEntity>> {
    const kyc = await this.kycService.updateStatus(kycId, payload, req.user.id);
    return new ResponseDataDto({
      data: new KYCEntity(kyc.toJSON()),
      message: "Successfully updated user KYC images",
      status: HttpStatus.OK,
    });
  }
}
