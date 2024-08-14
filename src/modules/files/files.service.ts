import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from "@nestjs/platform-express";
import { BadRequestException, Injectable } from "@nestjs/common";
import { diskStorage } from "multer";
import { extname } from "path";

@Injectable()
export class FilesService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          const filename = `${randomName}${extname(file.originalname.toLowerCase())}`;
          callback(null, filename);
        },
      }),
      // Optional limits and file filter
      limits: {
        fileSize: 1024 * 1024 * 10, // Limit file size to 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException("Only image files are allowed!"),
            false,
          );
        }
        callback(null, true);
      },
    };
  }
}
