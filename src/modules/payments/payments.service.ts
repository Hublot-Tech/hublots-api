import { HttpService } from "@nestjs/axios";
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "crypto";
import { Model } from "mongoose";
import { PaymentStatus } from "src/helpers/payment-status";
import { Payment } from "./schemas/payment.schema";
import {
  ChargePaymentResponse,
  InitializePayment,
  InitializePaymentResponse,
  VerifyPaymentResponse,
} from "./types/payment.type";
import { BulkQueryDto } from "src/helpers/api-dto";
import { Request } from "express";
import { DirectChargePaymentDto } from "./dto/payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
  ) {}

  async initialize(
    payload: InitializePayment,
    createdBy: string,
  ): Promise<Payment> {
    const newPayment: InitializePayment = {
      ...payload,
      currency: "XAF",
      reference: randomBytes(256).toString("hex"),
    };
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
      asset: transaction.metadata.asset,
      internal_reference: transaction.merchant_reference,
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

  async initializeAndCharge(
    request: Request,
    paymentDetails: DirectChargePaymentDto,
    amount: number,
  ): Promise<[Payment, ChargePaymentResponse]> {
    const { phoneNumber, email, id: userId } = request.user;
    const customerPhone = paymentDetails.phoneNumber ?? phoneNumber;
    const customerEmail = paymentDetails.email ?? email;
    const initializedPayment = await this.initialize(
      {
        amount,
        currency: "XAF",
        customer: { email: customerEmail, phone: customerPhone },
        reference: randomBytes(256).toString("base64url"),
      },
      userId,
    );
    const chargePayment = await this.charge(
      initializedPayment.reference,
      customerPhone,
    );

    return [initializedPayment, chargePayment];
  }

  async findOne(paymentIdOrRef: string): Promise<Payment> {
    const paymentDocument = await this.paymentModel
      .findOne({
        $or: [
          { id: paymentIdOrRef },
          { reference: paymentIdOrRef },
          { internal_reference: paymentIdOrRef },
        ],
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
      .limit(query.perpage)
      .skip(query.page)
      .exec();
  }
}
