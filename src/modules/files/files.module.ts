import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: FilesService,
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [MulterModule],
})
export class FilesModule {}
