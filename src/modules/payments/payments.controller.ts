import { Controller, Get, HttpStatus, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { ApiCustomOkResponse } from "src/helpers/api-decorator";
import { PaymentEntity } from "./dto/payment.dto";
import { ResponseDataDto } from "src/helpers/api-dto";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

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
