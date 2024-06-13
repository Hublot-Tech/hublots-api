import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Image } from "./schemas/image.schema";

@Injectable()
export class FileUploadService {
  private bucket: GridFSBucket;

  constructor(@InjectModel(Image.name) private imageModel: Model<Image>) {
    const connection = this.imageModel.db;
    this.bucket = new GridFSBucket(connection.db as any, {
      bucketName: "uploads",
    });
  }

  async uploadImage(file): Promise<Image> {
    const { filename, contentType, length, uploadDate } = file;
    const newImage = new this.imageModel({
      filename,
      contentType,
      length,
      uploadDate,
    });
    return newImage.save();
  }

  async getImageStream(id: string) {
    return this.bucket.openDownloadStream(new ObjectId(id));
  }

  async deleteImage(id: string) {
    await this.bucket.delete(new ObjectId(id));
    return this.imageModel.findByIdAndDelete(id);
  }
}
