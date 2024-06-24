import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import { PaginatedResponseDataDto, ResponseDataDto } from "src/helpers/api-dto";
import { ChatsService } from "./chats.service";
import {
  CreateMessageDto,
  MessageEntity,
  MessageQueryParamsDto,
} from "./dto/chat.dto";

@ApiBearerAuth()
@ApiTags("Chats")
@Controller("chats")
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post("/message")
  @ApiCustomCreatedResponse(MessageEntity)
  async sendMessage(
    @Req() request: Request,
    @Body() payload: CreateMessageDto,
  ): Promise<ResponseDataDto<MessageEntity>> {
    const message = await this.chatsService.create(
      payload,
      request.user._id as string,
    );

    return new ResponseDataDto({
      data: new MessageEntity(message.toJSON()),
      message: "Message successfully sent",
      status: HttpStatus.CREATED,
    });
  }

  @Get()
  @ApiOkPaginatedResponse(MessageEntity)
  async getMessages(
    @Req() request: Request,
    @Query() query: MessageQueryParamsDto,
  ) {
    const messages = await this.chatsService.findAll({
      ...query,
      sender: request.user._id as string,
    });
    return new PaginatedResponseDataDto({
      data: messages.map((message) => new MessageEntity(message.toJSON())),
      status: HttpStatus.OK,
      message: "Successfully retrieved messages",
      page: query.page ?? 1,
      perpage: query.perpage ?? 10,
    });
  }

  @Get(":id")
  @ApiCustomOkResponse(MessageEntity)
  async getMessageDetails(
    @Param("id") messageId: string,
  ): Promise<ResponseDataDto<MessageEntity>> {
    const message = await this.chatsService.findOne(messageId);
    return new ResponseDataDto({
      data: new MessageEntity(message.toJSON()),
      status: HttpStatus.OK,
      message: "Successfully retrieved message details",
    });
  }
}
