import { Module } from "@nestjs/common";
import { AnnouncementsController } from "./annnouncements.controller";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Announcement,
  AnnouncementSchema,
} from "./schemas/announcement.schema";
import { AnnouncementsService } from "./announcements.service";
import { FileUploadModule } from "../files/file-upload.module";

@Module({
  imports: [
    FileUploadModule.forRoot(process.env.DATABASE_HOST, "flyers"),
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
