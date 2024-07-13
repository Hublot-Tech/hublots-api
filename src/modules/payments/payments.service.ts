import { HttpService } from "@nestjs/axios";
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Model } from "mongoose";
import { BulkQueryDto } from "src/helpers/api-dto";
import { PaymentStatus } from "src/helpers/payment-status";
import { Payment } from "./schemas/payment.schema";
import {
  ChargePaymentResponse,
  InitializePayment,
  InitializePaymentResponse,
  VerifyPaymentResponse,
} from "./types/payment.type";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
  ) {}

  async initialize(
    newPayment: InitializePayment,
    createdBy: string,
  ): Promise<Payment> {
    newPayment.reference = Buffer.from(randomUUID()).toString("base64");
    const {
      status,
      data: { message, errors, transaction },
    } = await this.httpService.axiosRef.post<InitializePaymentResponse>(
      "/payments",
      newPayment,
    );

    if (status >= 400) {
      //getting the first error message
      const firstErrorMessage =
        errors && errors[0] && errors[0][0] ? errors[0][0] : message;

      throw new HttpException("Failed to initialize payment", status, {
        cause: firstErrorMessage,
      });
    }
    return new this.paymentModel({
      currency: transaction.currency,
      amount: transaction.amount,
      reference: transaction.reference,
      description: transaction.description,
      customer: transaction.customer,
      status: transaction.status,
      payer: createdBy,
    }).save();
  }

  async charge(
    paymentIdOrRef: string,
    phoneNumber: string,
  ): Promise<ChargePaymentResponse> {
    const payment = await this.findOne(paymentIdOrRef);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new UnprocessableEntityException(
        "Referenced transaction cannot be charge",
      );
    }

    const {
      status,
      data: chargePayment,
      data: { errors, message },
    } = await this.httpService.axiosRef.post<ChargePaymentResponse>(
      `/payments/${payment.reference}`,
      { channel: "cm.mobile", data: { phone: phoneNumber } },
    );
    if (status !== HttpStatus.ACCEPTED) {
      //getting the first error message
      const firstErrorMessage =
        errors && errors[0] && errors[0][0] ? errors[0][0] : message;

      throw new HttpException("Failed to charge payment", status, {
        cause: firstErrorMessage,
      });
    }

    return chargePayment;
  }

  async findOne(paymentIdOrRef: string): Promise<Payment> {
    const paymentDocument = await this.paymentModel
      .findOne({
        $or: [{ id: paymentIdOrRef }, { reference: paymentIdOrRef }],
      })
      .populate("payer")
      .exec();

    if (!paymentDocument) {
      throw new NotFoundException("Payment not found");
    }

    const {
      status,
      data: { message, errors, payment },
    } = await this.httpService.axiosRef.get<VerifyPaymentResponse>(
      `/payments/${paymentDocument.reference}`,
    );

    if (status !== 200) {
      //getting the first error message
      const firstErrorMessage =
        errors && errors[0] && errors[0][0] ? errors[0][0] : message;

      throw new HttpException("Could not check transaction status", status, {
        cause: firstErrorMessage,
      });
    }

    if (paymentDocument.status !== payment.status) {
      await paymentDocument
        .updateOne({ status: payment.status, updatedAt: new Date() })
        .exec();
    }

    return paymentDocument;
  }

  async findAll(query: BulkQueryDto): Promise<Payment[]> {
    return this.paymentModel
      .find(query)
      .limit(query.perpage ?? 10)
      .skip(query.page ?? 1)
      .exec();
  }
}
