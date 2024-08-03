import { InjectModel } from "@nestjs/mongoose";
import { Log } from "./schemas/log.schema";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private readonly logModel: Model<Log>) {}

  async create(userId: string, refreshToken: string): Promise<Log> {
    return new this.logModel({ user: userId, refreshToken }).save();
  }

  /**
   * Invalidates a refresh token
   * @param identifier log or user ID, or refresh token
   */
  async invalidate(identifier: string) {
    await this.logModel
      .findOneAndUpdate(
        {
          $or: [
            { id: identifier },
            { user: identifier },
            { refreshToken: identifier },
          ],
        },
        { isValid: false },
      )
      .sort({ loginAt: -1 })
      .exec();
  }

  async findOne(logId: string): Promise<Log> {
    return this.logModel.findById(logId).exec();
  }
}
