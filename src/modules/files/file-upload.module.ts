import { DynamicModule, Logger, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { GridFsStorage } from "multer-gridfs-storage";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { Image, ImageSchema } from "./schemas/image.schema";

@Module({})
export class FileUploadModule {
  private static readonly logger = new Logger(FileUploadModule.name);

  static forRoot(
    uri = "mongodb://localhost/mydb",
    bucketName: string,
  ): DynamicModule {
    this.logger.log(uri);
    const storage = new GridFsStorage({
      url: uri,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      file: (req, file) => {
        return {
          filename: file.originalname,
          bucketName: bucketName,
        };
      },
    });

    return {
      module: FileUploadModule,
      imports: [
        MulterModule.register({ storage }),
        MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }]),
      ],
      controllers: [FileUploadController],
      providers: [FileUploadService],
      exports: [MulterModule, FileUploadService],
    };
  }
}
