import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";

@ApiBearerAuth()
@ApiTags("Files")
@Controller("files")
export class FilesController {
  constructor() {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiCreatedResponse({ description: "returns the uploaded file" })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file;
  }
}
