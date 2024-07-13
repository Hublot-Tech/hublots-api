import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { HttpModule } from "@nestjs/axios";
import { MongooseModule } from "@nestjs/mongoose";
import { Payment, PaymentSchema } from "./schemas/payment.schema";

@Module({
  imports: [
    HttpModule.register({
      baseURL: "https://api.notchpay.co",
      headers: { Authorization: process.env.NOTCHPAY_PK },
    }),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentModule {}
