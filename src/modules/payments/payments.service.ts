import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "crypto";
import { Request } from "express";
import { Model } from "mongoose";
import { BulkQueryDto } from "src/helpers/api-dto";
import { PaymentStatus, TransactionType } from "src/helpers/payment-status";
import { DirectChargePaymentDto } from "./dto/payment.dto";
import { Payment } from "./schemas/payment.schema";
import {
  ChargePaymentResponse,
  CreateRecipient,
  CreateRecipientResponse,
  FetchRecipientResponse,
  FetchTransactionResponse,
  FetchTransferResponse,
  InitializePayment,
  InitializePaymentResponse,
  InitiateTransfer,
  InitiateTransferResponse,
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
      reference: randomBytes(25).toString("hex"),
    };
    const {
      data: { transaction, authorization_url },
    } = await this.httpService.axiosRef.post<InitializePaymentResponse>(
      "/payments",
      newPayment,
    );

    return new this.paymentModel({
      currency: transaction.currency,
      amount: transaction.amount,
      reference: transaction.reference,
      description: transaction.description,
      internal_reference: transaction.merchant_reference,
      customer: transaction.customer,
      status: transaction.status,
      authorization_url,
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

    const chargeResp =
      await this.httpService.axiosRef.post<ChargePaymentResponse>(
        `/payments/${payment.reference}`,
        { channel: "cm.mobile", phone: phoneNumber },
      );

    return chargeResp.data;
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
    const { data: recipientsData } =
      await this.httpService.axiosRef.get<FetchRecipientResponse>(
        `/recipients`,
      );

    let beneficiary = recipientsData.items.find(
      (_) => _.email === recipient.email && _.phone === recipient.phone,
    );

    if (!beneficiary) {
      const { data: beneficiaryData } =
        await this.httpService.axiosRef.post<CreateRecipientResponse>(
          `/recipients`,
          { ...recipient, channel: "cm.mobile" },
        );
      beneficiary = beneficiaryData.beneficiary;
    }

    const initiateTransfer: InitiateTransfer = {
      amount,
      currency: "XAF",
      description: "Service Provider payout",
      recipient: beneficiary.id,
    };
    const {
      data: { transfer },
    } = await this.httpService.axiosRef.post<InitiateTransferResponse>(
      `/transfers`,
      initiateTransfer,
    );

    return new this.paymentModel({
      currency: transfer.currency,
      amount: transfer.amount,
      reference: transfer.reference,
      description: transfer.description,
      status: transfer.status,
      customer: transfer.beneficiary,
      type: TransactionType.PAY_OUT,
      payer: transferedBy,
      updatedAt: new Date(),
    }).save();
  }

  async findOne(paymentRefOrID: string): Promise<Payment> {
    const paymentDocument = await this.paymentModel
      .findOne({
        $or: [
          { id: paymentRefOrID },
          { reference: paymentRefOrID },
          { internal_reference: paymentRefOrID },
        ],
      })
      .exec();

    if (!paymentDocument) {
      throw new NotFoundException(
        `Payment with reference or ID ${paymentRefOrID} not found`,
      );
    }

    const { data: paymentData } = await this.httpService.axiosRef.get<
      FetchTransactionResponse & FetchTransferResponse
    >(
      `/${paymentDocument.type === TransactionType.PAY_IN ? "payments" : "transfers"}/${paymentDocument.reference}`,
    );
    const payment =
      paymentDocument.type === TransactionType.PAY_IN
        ? paymentData.transaction
        : paymentData.transfer;

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
      .skip(query.perpage * (query.page - 1))
      .exec();
  }
}
