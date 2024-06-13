import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { FileUploadService } from "./file-upload.service";
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import { ResponseMetadataDto } from "../dto";

@ApiTags("Files")
@Controller("files")
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiCreatedResponse({
    description: "returns the ID of the uploaded images in database ",
  })
  async uploadFile(@UploadedFile() file) {
    const image = await this.fileUploadService.uploadImage(file);
    return { imageId: image._id };
  }

  @Get(":id")
  @ApiProduces("application/octet-stream")
  async getFile(@Param("id") id: string, @Res() res: Response) {
    const fileStream = await this.fileUploadService.getImageStream(id);
    fileStream.pipe(res);
  }

  @Delete(":id")
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
    description: "File successfully deleted",
  })
  async deelteFile(@Param("id") id: string) {
    await this.fileUploadService.deleteImage(id);
    return new ResponseMetadataDto({
      status: HttpStatus.NO_CONTENT,
      message: "File successfully deleted",
    });
  }
}
