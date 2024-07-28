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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import { PaginatedResponseDataDto, ResponseDataDto } from "src/helpers/api-dto";
import { MongoIdPipe } from "src/helpers/custom-pipes";
import { MessagesService } from "./messages.service";
import {
  CreateMessageDto,
  MessageDetailsDto,
  MessageEntity,
  MessageQueryParamsDto,
} from "./dto/chat.dto";

@ApiBearerAuth()
@ApiTags("Chats")
@Controller("messages")
export class MessagesController {
  constructor(private chatsService: MessagesService) {}

  @Post("/new")
  @ApiCustomCreatedResponse(MessageEntity)
  @ApiOperation({ summary: "Message another user of platform." })
  async sendMessage(
    @Req() request: Request,
    @Body() payload: CreateMessageDto,
  ): Promise<ResponseDataDto<MessageEntity>> {
    const message = await this.chatsService.create(payload, request.user.id);

    return new ResponseDataDto({
      data: new MessageEntity(message.toJSON()),
      message: "Message successfully sent",
      status: HttpStatus.CREATED,
    });
  }

  @Get()
  @ApiOkPaginatedResponse(MessageEntity)
  @ApiOperation({
    summary: "Fetch messages sent or received from interlocutors",
  })
  async getMessages(
    @Req() request: Request,
    @Query() queryParams: MessageQueryParamsDto,
  ) {
    if (queryParams.interlocutors.length < 2) {
      queryParams.interlocutors.push(request.user.id);
    }

    const messages = await this.chatsService.findAll(queryParams);
    return new PaginatedResponseDataDto({
      data: messages.map((message) => new MessageEntity(message.toJSON())),
      status: HttpStatus.OK,
      message: "Successfully retrieved messages",
      page: queryParams.page,
      perpage: queryParams.perpage,
    });
  }

  @Get(":id")
  @ApiCustomOkResponse(MessageDetailsDto)
  @ApiOperation({ summary: "Fetch message details." })
  async getMessageDetails(
    @Param("id", MongoIdPipe) messageId: string,
  ): Promise<ResponseDataDto<MessageDetailsDto>> {
    const message = await this.chatsService.findOne(messageId);
    return new ResponseDataDto({
      data: new MessageDetailsDto(message.toJSON()),
      status: HttpStatus.OK,
      message: "Successfully retrieved message details",
    });
  }
}
