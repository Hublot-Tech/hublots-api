import { Controller, Get, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import {
  BulkQueryDto,
  PaginatedResponseDataDto,
  ResponseDataDto,
} from "src/helpers/api-dto";
import { PaymentEntity } from "./dto/payment.dto";
import { PaymentsService } from "./payments.service";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @UseRoles(Role.ADMIN, Role.SUPPORT)
  @ApiOkPaginatedResponse(PaymentEntity)
  async findPayments(
    @Query() params: BulkQueryDto,
  ): Promise<PaginatedResponseDataDto<PaymentEntity>> {
    const payments = await this.paymentsService.findAll(params);
    return new PaginatedResponseDataDto({
      ...params,
      data: payments.map((payment) => new PaymentEntity(payment.toJSON())),
      message: "Successfully retrieved payment",
      status: HttpStatus.OK,
    });
  }

  @Get(":id")
  @ApiCustomOkResponse(PaymentEntity)
  async findPayment(
    @Param("id") paymentId: string,
  ): Promise<ResponseDataDto<PaymentEntity>> {
    const payment = await this.paymentsService.findOne(paymentId);
    return new ResponseDataDto({
      data: new PaymentEntity(payment.toJSON()),
      message: "Successfully retrieved payment",
      status: HttpStatus.OK,
    });
  }
}
