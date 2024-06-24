import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileUploadModule } from "../files/file-upload.module";
import { UsersModule } from "../users/users.module";
import { OffersModule } from "./offers/offers.module";
import { Service, ServiceSchema } from "./schemas/service.schema";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";

@Module({
  imports: [
    UsersModule,
    OffersModule,
    FileUploadModule.forRoot(process.env.DATABASE_HOST, "serviceImages"),
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
