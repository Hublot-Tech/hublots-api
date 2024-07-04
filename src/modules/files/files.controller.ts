import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorator/auth.decorator";

@ApiTags("Files")
@Controller("files")
export class FilesController {
  constructor() {}

  @Public()
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiCreatedResponse({
    description: "returns the uploaded file",
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file;
  }
}
