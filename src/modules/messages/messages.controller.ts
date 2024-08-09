import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import {
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import { MongoIdPipe } from "src/helpers/custom-pipes";
import { MessagesService } from "./messages.service";
import {
  CreateMessageDto,
  MessageDetailsDto,
  MessageEntity,
  MessageQueryParamsDto,
  UpdateMessageDto,
} from "./dto/message.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { MsgContentType } from "./schemas/message.schema";

@ApiBearerAuth()
@ApiTags("Chats")
@Controller("chats")
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  @ApiOkPaginatedResponse(MessageEntity)
  @ApiOperation({ summary: "Fetch user chats" })
  async getConversations(@Req() request: Request) {
    const chats = await this.messagesService.findChats(request.user.id);
    return new PaginatedResponseDataDto({
      data: chats,
      status: HttpStatus.OK,
      message: "Successfully retrieved chats",
      page: 1,
      perpage: chats.length,
    });
  }

  @Post("messages/new")
  @ApiCustomCreatedResponse(MessageEntity)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Message another user of platform." })
  async sendMessage(
    @Req() request: Request,
    @Body() payload: CreateMessageDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDataDto<MessageEntity>> {
    if (!file && MsgContentType.FILE === payload.contentType) {
      throw new BadRequestException(
        "File is required when contentType is of type `file`",
      );
    }

    const message = await this.messagesService.create(
      {
        ...payload,
        fileRef: file ? `${process.env.PUBLIC_URL}/${file.filename}` : null,
      },
      request.user.id,
    );

    return new ResponseDataDto({
      data: new MessageEntity(message.toJSON()),
      message: "Message successfully created",
      status: HttpStatus.CREATED,
    });
  }

  @Get("messages")
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

    const messages = await this.messagesService.findAll(queryParams);
    return new PaginatedResponseDataDto({
      data: messages.map((message) => new MessageEntity(message.toJSON())),
      status: HttpStatus.OK,
      message: "Successfully retrieved messages",
      page: queryParams.page,
      perpage: queryParams.perpage,
    });
  }

  @Get("messages/:id")
  @ApiCustomOkResponse(MessageDetailsDto)
  @ApiOperation({ summary: "Fetch message details." })
  async getMessageDetails(
    @Param("id", MongoIdPipe) messageId: string,
  ): Promise<ResponseDataDto<MessageDetailsDto>> {
    const message = await this.messagesService.findOne(messageId);
    return new ResponseDataDto({
      data: new MessageDetailsDto(message.toJSON()),
      status: HttpStatus.OK,
      message: "Successfully retrieved message details",
    });
  }

  @Put("messages/:id")
  @ApiCustomOkResponse(MessageEntity)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Fetch message details." })
  async updateMessage(
    @Req() request: Request,
    @Param("id", MongoIdPipe) messageId: string,
    @Body() payload: UpdateMessageDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDataDto<MessageEntity>> {
    const message = await this.messagesService.update(
      messageId,
      {
        content: payload.content,
        fileRef: file
          ? `${process.env.PUBLIC_URL}/${file.filename}`
          : undefined,
      },
      request.user.id,
    );

    return new ResponseDataDto({
      data: new MessageEntity(message.toJSON()),
      message: "Successfully updated message content",
      status: HttpStatus.OK,
    });
  }

  @Delete("messages/:id")
  @ApiOperation({ summary: "Delete a sent message." })
  async deleteMessage(
    @Req() request: Request,
    @Param("id", MongoIdPipe) messageId: string,
  ): Promise<ResponseMetadataDto> {
    await this.messagesService.delete(messageId, request.user.id);

    return new ResponseMetadataDto({
      message: "Successfully deleted message status",
      status: HttpStatus.OK,
    });
  }

  @Patch(["messages/:id/read", "messages/:id/delivered"])
  @ApiOperation({ summary: "Mark a message as read or delivered." })
  async updateMessageStatus(
    @Req() request: Request,
    @Param("id", MongoIdPipe) messageId: string,
  ): Promise<ResponseMetadataDto> {
    await this.messagesService.updateStatus(
      messageId,
      request.url.includes("read") ? "read" : "delivered",
      request.user.id,
    );

    return new ResponseMetadataDto({
      message: "Successfully updated message status",
      status: HttpStatus.OK,
    });
  }
}
