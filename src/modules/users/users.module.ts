import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { FilesModule } from "../files/files.module";
import { KYC, KYCSchema } from "./schemas/kyc.schema";
import { User, UserSchema } from "./schemas/user.schema";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    FilesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: KYC.name, schema: KYCSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
