import { Module } from "@nestjs/common";
import { BlotsController } from "./blots.controller";
import { BlotsService } from "./blots.service";

@Module({
  controllers: [BlotsController],
  providers: [BlotsService],
})
export class BlotsModule {}
