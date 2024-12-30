import { ClassSerializerInterceptor, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppInterceptor } from "./app.interceptor";
import { AppService } from "./app.service";
import { AnnouncementsModule } from "./modules/annoucements/annnouncements.module";
import { AuthorizationGuard } from "./modules/auth/auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { BlotsModule } from "./modules/blots/blots.module";
import { FilesModule } from "./modules/files/files.module";
import { KYCModule } from "./modules/kyc/kyc.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ServicesModule } from "./modules/services/services.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        const mongoUri = configService.get("MONGO_URI");
        return { uri: mongoUri };
      },
    }),
    FilesModule,
    KYCModule,
    AuthModule,
    UsersModule,
    MessagesModule,
    ServicesModule,
    PaymentsModule,
    BlotsModule,
    SubscriptionsModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AppInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
