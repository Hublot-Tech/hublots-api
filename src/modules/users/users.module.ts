import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schema/user.schema";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

import { AuthService } from "../auth/auth.service";
import { FileUploadModule } from "../files/file-upload.module";
import { Log, LogSchema } from "./schema/log.schema";

import { ClientModule } from './client/client.module';
import { ProvModule } from './prov/prov.module';
import { ServiceModule } from "../service/service.module";

@Module({
  imports: [
    FileUploadModule.forRoot(process.env.DATABASE_HOST, "kycImages"),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService],
  exports: [UsersService],
})
export class UsersModule {}
