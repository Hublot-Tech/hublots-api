import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
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
import { PaginatedResponseDataDto, ResponseDataDto } from "src/helpers/api-dto";
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
@Controller("messages")
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post("/new")
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

    const messages = await this.messagesService.findAll(queryParams);
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
    const message = await this.messagesService.findOne(messageId);
    return new ResponseDataDto({
      data: new MessageDetailsDto(message.toJSON()),
      status: HttpStatus.OK,
      message: "Successfully retrieved message details",
    });
  }

  @Put(":id")
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
}
