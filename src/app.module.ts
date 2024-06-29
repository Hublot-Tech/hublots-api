import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { ChatModule } from "./modules/chat/chat.module";
import { ServicesModule } from "./modules/services/services.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { BlotsModule } from "./modules/blots/blots.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthorizationGuard } from "./modules/auth/auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_HOST),
    AuthModule,
    UsersModule,
    ChatModule,
    ServicesModule,
    PaymentModule,
    BlotsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule {}
