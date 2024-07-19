import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Query,
  Req,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
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
  @ApiOperation({
    summary:
      "Fetch all blots where the owner of the access token is either a consumer or a provider",
    description: "Use Query params to override the default behavior",
  })
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
  @UseRoles(Role.PROVIDER, Role.CLIENT)
  @ApiCustomOkResponse(BlotDetailsDto)
  @ApiOperation({
    summary: "Fetch blot details.",
    description:
      "Requires authorized user to have a `client` or `provider` role access.",
  })
  async findOne(
    @Req() request: Request,
    @Param("id") blotId: string,
  ): Promise<ResponseDataDto<BlotDetailsDto>> {
    const blot = await this.blotsService.findOne(blotId, request.user.id);
    return new ResponseDataDto({
      data: new BlotDetailsDto(blot.toJSON()),
      message: "Successfully retrieved blot details",
      status: HttpStatus.OK,
    });
  }

  @Post("/new")
  @ApiOperation({
    summary: "Create new blot.",
    description: "Requires access token owner to have a `provider` role",
  })
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
  @ApiOperation({
    summary: "Update blot.",
    description: "Requires access token owner to have a `provider` role",
  })
  @ApiCustomOkResponse(BlotEntity)
  async update(
    @Req() request: Request,
    @Param("id") blotId: string,
    @Body() payload: UpdateBlotDto,
  ): Promise<ResponseDataDto<BlotEntity>> {
    if (
      ![
        BlotStatus.ACCEPTED,
        BlotStatus.FINALIZED,
        BlotStatus.CANCELLED,
      ].includes(payload.status)
    ) {
      throw new UnprocessableEntityException(
        "Please use the allocate endpoints to accept, finalize or cancel a blot",
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

  @UseRoles(Role.CLIENT)
  @Put(":id/accept-offer")
  @ApiOperation({
    summary: "Accpet blot offer.",
    description:
      "Requires access token owner to have a `client` role and be the consumer of the blot",
  })
  @ApiCustomOkResponse(BlotEntity)
  async acceptOffer(
    @Req() request: Request,
    @Param("id") blotId: string,
    @Body() paymentDetails: DirectChargePaymentDto,
  ): Promise<ResponseDataDto<BlotEntity>> {
    let blot = await this.blotsService.findOne(blotId, request.user.id);
    const [initializedPayment, chargePayment] =
      await this.paymentsService.initializeAndCharge(
        request,
        paymentDetails,
        blot.price,
      );

    blot = await this.blotsService.update(
      blotId,
      { payment: initializedPayment.id, status: BlotStatus.ACCEPTED },
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(blot.toJSON()),
      message: chargePayment.message,
      status: chargePayment.code,
    });
  }

  @UseRoles(Role.CLIENT)
  @Put(":id/finalize")
  @ApiOperation({
    summary: "Finilize a blot marking it as successfully completed.",
    description:
      "Requires access token owner to have a `client` role and be the consumer of the blot",
  })
  @ApiCustomOkResponse(BlotEntity)
  async finalizeBlot(
    @Req() request: Request,
    @Param("id") blotId: string,
  ): Promise<ResponseDataDto<BlotEntity>> {
    let blot = await this.blotsService.findOne(blotId, request.user.id);
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
      { payoutRef: payment.id, status: BlotStatus.FINALIZED },
      request.user.id,
    );

    return new ResponseDataDto({
      data: new BlotEntity(blot.toJSON()),
      message: "Successfully initiated provider funds transfer",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id")
  @UseRoles(Role.CLIENT, Role.PROVIDER)
  @ApiOperation({
    summary: "Cancel a blot offer.",
    description: `Blot with \`${BlotStatus.STARTED_WORK}\` or \`${BlotStatus.FINALIZED}\` status cannot be cancelled. 
    Requires access token owner to have a \`client\` or \`provider\` role and be the consumer/provider of the blot`,
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async delete(
    @Req() request: Request,
    @Param("id") blotId: string,
  ): Promise<ResponseMetadataDto> {
    await this.blotsService.cancel(blotId, request.user.id);

    return new ResponseMetadataDto({
      message: "Blot offer was cancelled",
      status: HttpStatus.OK,
    });
  }

  @Post(":id/options")
  @ApiOperation({
    summary: "Add personnalized options to blot.",
    description: "Requires authorized user to have a `provider` role",
  })
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
  @ApiOperation({
    summary: "Delete a list of options from blot.",
    description: "Requires authorized user to have a `provider` role",
  })
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
