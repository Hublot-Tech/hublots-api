import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  NotAcceptableException,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import {
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { DirectChargePaymentDto } from "../payments/dto/payment.dto";
import { PaymentsService } from "../payments/payments.service";
import { Role } from "../users/dto";
import { BlotsService } from "./blots.service";
import {
  BlotDetailsDto,
  BlotEntity,
  BlotQueryParams,
  CreateBlotDto,
  CreateBlotOptionDto,
  UpdateBlotDto,
} from "./dto/blot.dto";
import { BlotStatus } from "./schemas/blot.schema";

@ApiBearerAuth()
@ApiTags("Blots")
@Controller("blots")
@UseRoles(Role.PROVIDER)
export class BlotsController {
  constructor(
    private blotsService: BlotsService,
    private paymentsService: PaymentsService,
  ) {}

  @Get()
  @UseRoles()
  @ApiOkPaginatedResponse(BlotEntity)
  async finAll(
    @Req() request: Request,
    @Query() query: BlotQueryParams,
  ): Promise<PaginatedResponseDataDto<BlotEntity>> {
    const activeUser = [Role.CLIENT, Role.PROVIDER].some((role) =>
      request.user.roles.includes(role),
    )
      ? request.user.id
      : undefined;
    const blots = await this.blotsService.findAll(query, activeUser);

    return new PaginatedResponseDataDto({
      data: blots.map((blot) => new BlotEntity(blot.toJSON())),
      page: query.page,
      perpage: query.perpage,
      status: HttpStatus.OK,
      message: "Successfully retrieved blots",
    });
  }

  @Get(":id")
  @ApiCustomOkResponse(BlotDetailsDto)
  async findOne(
    @Param("id") blotId: string,
  ): Promise<ResponseDataDto<BlotDetailsDto>> {
    const blot = await this.blotsService.findOne(blotId);
    return new ResponseDataDto({
      data: new BlotDetailsDto(blot.toJSON()),
      message: "Successfully retrieved blot details",
      status: HttpStatus.OK,
    });
  }

  @Post("/new")
  @ApiCustomCreatedResponse(BlotEntity)
  async create(
    @Req() request: Request,
    @Body() payload: CreateBlotDto,
  ): Promise<ResponseDataDto<BlotEntity>> {
    if (!request.user.roles.includes(Role.PROVIDER)) {
      throw new ForbiddenException(
        "Operation not permitted for active user. Only provider can create blot",
      );
    }
    const newBlot = await this.blotsService.create(payload, request.user.id);

    return new ResponseDataDto({
      data: new BlotEntity(newBlot.toJSON()),
      message: "Successfully created blot",
      status: HttpStatus.OK,
    });
  }

  @Put(":id")
  @ApiCustomOkResponse(BlotEntity)
  async update(
    @Req() request: Request,
    @Param("id") blotId: string,
    @Body() payload: UpdateBlotDto,
  ): Promise<ResponseDataDto<BlotEntity>> {
    if (![BlotStatus.ACCEPTED, BlotStatus.COMPLETED].includes(payload.status)) {
      throw new NotAcceptableException(
        "Please use the allocate endpoints to accept or finalize a blot",
      );
    }

    const updatedBlot = await this.blotsService.update(
      blotId,
      payload,
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(updatedBlot.toJSON()),
      message: "Successfully updated blot",
      status: HttpStatus.OK,
    });
  }

  @Put(":id/accept-offer")
  @ApiCustomOkResponse(BlotEntity)
  async acceptOffer(
    @Req() request: Request,
    @Param("id") blotId: string,
    @Body() paymentDetails: DirectChargePaymentDto,
  ): Promise<ResponseDataDto<BlotEntity>> {
    let blot = await this.blotsService.findOne(blotId);
    const [initializedPayment, chargePayment] =
      await this.paymentsService.initializeAndCharge(
        request,
        paymentDetails,
        blot.price,
      );

    blot = await this.blotsService.update(
      blotId,
      { payment: initializedPayment.id },
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(blot.toJSON()),
      message: chargePayment.message,
      status: chargePayment.code,
    });
  }

  @Put(":id/finalize")
  @ApiCustomOkResponse(BlotEntity)
  async finalizeBlot(
    @Req() request: Request,
    @Param("id") blotId: string,
  ): Promise<ResponseDataDto<BlotEntity>> {
    let blot = await this.blotsService.findOne(blotId);
    const { provider, price } = new BlotDetailsDto(blot.toJSON());
    const payment = await this.paymentsService.transfer(
      {
        email: provider.email,
        name: provider.fullname,
        phone: provider.phoneNumber,
        number: provider.phoneNumber,
      },
      price,
      request.user.id,
    );

    blot = await this.blotsService.update(
      blotId,
      { payoutRef: payment.id },
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(blot.toJSON()),
      message: "Successfully initiated provider funds transfer",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id")
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async delete(
    @Req() request: Request,
    @Param("id") blotId: string,
  ): Promise<ResponseMetadataDto> {
    await this.blotsService.delete(blotId, request.user.id);

    return new ResponseMetadataDto({
      message: "Successfully updated blot",
      status: HttpStatus.OK,
    });
  }

  @Put(":id/options")
  @ApiBody({ type: [CreateBlotOptionDto] })
  @ApiCustomOkResponse(BlotEntity)
  async updateOptions(
    @Req() request: Request,
    @Param("id") blotId: string,
    @Body(new ParseArrayPipe({ items: CreateBlotOptionDto }))
    blotOptions: CreateBlotOptionDto[],
  ): Promise<ResponseDataDto<BlotEntity>> {
    const updatedBlot = await this.blotsService.addOptions(
      blotId,
      blotOptions,
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(updatedBlot.toJSON()),
      message: "Successfully updated blot",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id/options")
  @ApiCustomOkResponse(BlotEntity)
  async deleteOptions(
    @Req() request: Request,
    @Param("id") blotId: string,
    @Query(new ParseArrayPipe({ items: String }))
    optionIds: string[],
  ): Promise<ResponseDataDto<BlotEntity>> {
    const updatedBlot = await this.blotsService.removeOptions(
      blotId,
      optionIds,
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(updatedBlot.toJSON()),
      message: "Successfully updated blot",
      status: HttpStatus.OK,
    });
  }
}
