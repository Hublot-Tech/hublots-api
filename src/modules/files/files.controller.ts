import {
  BadRequestException,
  Controller,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { ApiCustomCreatedResponse } from "src/helpers/api-decorator";
import { ResponseDataDto } from "src/helpers/api-dto";
import { Public } from "../auth/decorator/auth.decorator";

@ApiBearerAuth()
@ApiTags("Files")
@Controller("files")
export class FilesController {
  constructor() {}

  @Public()
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        images: {
          type: "string",
          format: "binary",
          description: "Binary files to upload",
        },
      },
    },
  })
  @ApiCustomCreatedResponse(String)
  @ApiConsumes("multipart/form-data")
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): ResponseDataDto<string> {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    return new ResponseDataDto({
      data: `${process.env.PUBLIC_URL}/${file.filename}`,
      message: "File successfully uploaded",
      status: HttpStatus.OK,
    });
  }

  @Post("bulk-upload")
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        images: {
          type: "array",
          format: "binary",
          description: "Array of binary files to upload",
        },
      },
    },
  })
  @ApiCustomCreatedResponse(String, true)
  @ApiConsumes("multipart/form-data")
  uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): ResponseDataDto<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("Files is required");
    }

    return new ResponseDataDto({
      data: files.map((file) => `${process.env.PUBLIC_URL}/${file.filename}`),
      message: "Files successfully uploaded",
      status: HttpStatus.OK,
    });
  }
}
