import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateMessageDto, MessageQueryParamsDto } from "./dto/chat.dto";
import { Message } from "./schemas/chat.schema";

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Message.name) private readonly chatModel: Model<Message>,
  ) {}

  async create(data: CreateMessageDto, createdBy: string): Promise<Message> {
    return new this.chatModel({ ...data, sender: createdBy }).save();
  }

  async findOne(chatId: string): Promise<Message> {
    return this.chatModel
      .findById(chatId)
      .populate("sender")
      .populate("receiver")
      .exec();
  }

  async findAll({
    interlocutors,
    ...query
  }: MessageQueryParamsDto): Promise<Message[]> {
    return this.chatModel
      .find({
        $or: [
          { receiver: interlocutors[0], sender: interlocutors[1] },
          { receiver: interlocutors[1], sender: interlocutors[0] },
        ],
      })
      .limit(query.perpage)
      .skip(query.page)
      .exec();
  }
}
