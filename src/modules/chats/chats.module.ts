import { Module } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { ChatsController } from "./chats.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessageSchema } from "./schemas/chat.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}
