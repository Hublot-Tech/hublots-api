import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { ChatModule } from "./modules/chat/chat.module";
import { ServiceModule } from "./modules/service/service.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { OrderModule } from "./modules/order/order.module";
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
    ServiceModule,
    PaymentModule,
    OrderModule,
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
