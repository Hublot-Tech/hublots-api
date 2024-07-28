import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  CreateMessageDto,
  MessageQueryParamsDto,
  UpdateMessageDto,
} from "./dto/message.dto";
import { Message, MsgContentType } from "./schemas/message.schema";

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  async create(data: CreateMessageDto, createdBy: string): Promise<Message> {
    return new this.messageModel({ ...data, sender: createdBy }).save();
  }

  async findOne(messageId: string): Promise<Message> {
    const message = this.messageModel
      .findById(messageId)
      .populate("sender")
      .populate("receiver")
      .exec();

    if (!message) {
      throw new NotFoundException(`Message with  id ${messageId} not found`);
    }
    return message;
  }

  async findAll({
    interlocutors,
    ...query
  }: MessageQueryParamsDto): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { receiver: interlocutors[0], sender: interlocutors[1] },
          { receiver: interlocutors[1], sender: interlocutors[0] },
        ],
      })
      .limit(query.perpage)
      .skip(query.perpage * (query.page - 1))
      .exec();
  }

  async update(
    messageId: string,
    payload: Omit<UpdateMessageDto, "file">,
    updatedBy: string,
  ): Promise<Message> {
    const message = await this.messageModel.findById(messageId).exec();

    if (!message) {
      throw new NotFoundException(`Message with  id ${messageId} not found`);
    }
    if (message.sender.toString() !== updatedBy) {
      throw new UnauthorizedException("Message can only be edited by sender");
    }

    if (MsgContentType.TEXT === message.contentType && payload.fileRef) {
      throw new UnprocessableEntityException(
        "File is not supported for text content",
      );
    }

    if (!payload.content && MsgContentType.TEXT === message.contentType) {
      throw new UnprocessableEntityException("Message cannot be empty");
    }

    await message
      .updateOne({
        ...payload,
        readAt: null,
        deliveredAt: null,
        updatedAt: new Date(),
      })
      .exec();
    return this.messageModel.findById(messageId).exec();
  }

  async updateStatus(
    messageId: string,
    status: "read" | "delivered",
    updatedBy: string,
  ): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();

    if (!message) {
      throw new NotFoundException(`Message with  id ${messageId} not found`);
    }
    if (message.receiver.toString() !== updatedBy) {
      throw new UnauthorizedException(
        "Message status can only be updated by receiver",
      );
    }

    if (message.readAt) {
      throw new UnprocessableEntityException("Message was already read");
    }

    await message
      .updateOne({
        deliveredAt: message.deliveredAt ?? new Date(),
        readAt: status === "read" ? new Date() : undefined,
      })
      .exec();
  }
}
