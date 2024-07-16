import { Global, Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";

@Global()
@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: FilesService,
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
