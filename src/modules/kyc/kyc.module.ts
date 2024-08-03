import { Module } from "@nestjs/common";
import { KYCService } from "./kyc.service";
import { KYCController } from "./kyc.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../users/schemas/user.schema";
import { KYC, KYCSchema } from "./schemas/kyc.schema";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [
    FilesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: KYC.name, schema: KYCSchema },
    ]),
  ],
  controllers: [KYCController],
  providers: [KYCService],
})
export class KYCModule {}
