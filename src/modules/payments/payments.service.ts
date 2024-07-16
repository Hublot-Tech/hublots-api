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
import { Request } from "express";
import { Model } from "mongoose";
import { BulkQueryDto } from "src/helpers/api-dto";
import { PaymentStatus } from "src/helpers/payment-status";
import { DirectChargePaymentDto } from "./dto/payment.dto";
import { Payment, PaymentType } from "./schemas/payment.schema";
import {
  ChargePaymentResponse,
  CreateRecipient,
  CreateRecipientResponse,
  FetchRecipientResponse,
  InitializePayment,
  InitializePaymentResponse,
  InitiateTransfer,
  InitiateTransferResponse,
  FetchTransactionResponse,
  FetchTransferResponse,
  ResponseMetadata,
} from "./types/payment.type";

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
      { channel: "cm.mobile", phone: phoneNumber },
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

  async transfer(
    recipient: CreateRecipient,
    amount: number,
    transferedBy: string,
  ) {
    const { status, data: recipientsData } =
      await this.httpService.axiosRef.get<FetchRecipientResponse>(
        `/recipients`,
      );
    if (status !== HttpStatus.OK) {
      throwCustomError("Failed to fetch recipient", recipientsData);
    }
    let beneficiary = recipientsData.items.find(
      (_) => _.email === recipient.email && _.phone === recipient.phone,
    );

    if (!beneficiary) {
      const { status, data: beneficiaryData } =
        await this.httpService.axiosRef.post<CreateRecipientResponse>(
          `/recipients`,
          { ...recipient, channel: "cm.mobile" },
        );

      if (status !== HttpStatus.CREATED) {
        throwCustomError("Failed to create recipient", beneficiaryData);
      }
      beneficiary = beneficiaryData.beneficiary;
    }

    const initiateTransfer: InitiateTransfer = {
      amount,
      currency: "XAF",
      description: "Service Provider payout",
      recipient: beneficiary.id,
    };
    const { status: transferRespStatus, data: transferData } =
      await this.httpService.axiosRef.post<InitiateTransferResponse>(
        `/transfers`,
        initiateTransfer,
      );

    if (transferRespStatus !== HttpStatus.CREATED) {
      throwCustomError("Failed to initiate transfer", transferData);
    }

    return new this.paymentModel({
      currency: transferData.transfer.currency,
      amount: transferData.transfer.amount,
      reference: transferData.transfer.reference,
      description: transferData.transfer.description,
      status: transferData.transfer.status,
      customer: transferData.transfer.beneficiary,
      paymentType: PaymentType.PAY_OUT,
      payer: transferedBy,
    }).save();
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

    const { status, data: paymentData } = await this.httpService.axiosRef.get<
      FetchTransactionResponse & FetchTransferResponse
    >(
      `/${paymentDocument.paymentType === PaymentType.PAY_IN ? "payments" : "transfers"}/${paymentDocument.reference}`,
    );
    const payment =
      paymentDocument.paymentType === PaymentType.PAY_IN
        ? paymentData.transaction
        : paymentData.transfer;
    if (status !== HttpStatus.OK) {
      throwCustomError("Could not check transaction status", paymentData);
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

function throwCustomError(
  customErrorMessage: string,
  { errors, code: status, message }: ResponseMetadata,
) {
  //getting the first error message
  const firstErrorMessage =
    errors && errors[0] && errors[0][0] ? errors[0][0] : message;

  throw new HttpException(customErrorMessage, status, {
    cause: firstErrorMessage,
  });
}
