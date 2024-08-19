import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ChatEntity,
  CreateMessageDto,
  MessageQueryParamsDto,
  UpdateMessageDto,
} from "./dto/message.dto";
import { Message, MsgContentType } from "./schemas/message.schema";
import { User } from "../users/schemas/user.schema";

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  async create(payload: CreateMessageDto, createdBy: string): Promise<Message> {
    if (MsgContentType.TEXT === payload.contentType) {
      if (payload.resource) {
        throw new UnprocessableEntityException(
          "Resource is not supported for text content",
        );
      }

      if (!payload.content) {
        throw new UnprocessableEntityException("Message cannot be empty");
      }
    } else {
      if (!payload.resource) {
        throw new UnprocessableEntityException(
          `Resource is required for content type ${payload.contentType}`,
        );
      }
    }

    return new this.messageModel({ ...payload, sender: createdBy }).save();
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

  async findChats(userId: string): Promise<ChatEntity[]> {
    const receivers = await this.messageModel
      .distinct("receiver", { sender: userId })
      .exec();
    const messages = await this.messageModel
      .find({ $or: receivers.map((receiver) => ({ receiver })) })
      .populate("receiver")
      .sort({ updatedAt: -1 })
      .exec();

    return receivers.map((id) => {
      const { receiver, content, resource } = messages.find(
        (_) => _.receiver.id.toString() === id.toString(),
      );
      const receiverData = receiver as unknown as User;
      return new ChatEntity({
        name: receiverData.fullname,
        interlocutor: receiverData.id,
        lastMessage: content ?? resource,
        updatedAt: receiverData.updatedAt,
      });
    });
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
    //only update messages not older than 5 min
    if (message.createdAt.getTime() > Date.now() - 300_000) {
      throw new UnprocessableEntityException(
        "Cannot update messages older than 5 minutes",
      );
    }

    if (MsgContentType.TEXT === message.contentType && payload.resource) {
      throw new UnprocessableEntityException(
        "Resource is not supported for text content",
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

  async delete(messageId: string, deletedBy: string) {
    const message = await this.messageModel.findById(messageId).exec();

    if (!message) {
      throw new NotFoundException(`Message with  id ${messageId} not found`);
    }
    if (message.sender.toString() !== deletedBy) {
      throw new UnauthorizedException(
        "Message status can only be deleted by sender",
      );
    }
    //only update messages not older than 5 min
    if (message.createdAt.getTime() > Date.now() - 300_000) {
      throw new UnprocessableEntityException(
        "Cannot delete messages older than 5 minutes",
      );
    }

    await message.deleteOne().exec();
  }
}
