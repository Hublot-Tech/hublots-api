import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
  ApiOkPaginatedResponse,
} from "src/helpers/api-decorator";
import {
  CreateSubscriptionPlanDto,
  SubscriptionEntity,
  SubscriptionPlanEntity,
  UpdateSubscriptionPlanDto,
} from "./dto/subscription.dto";
import { SubscriptionsService } from "./subscriptions.service";
import {
  PaginatedResponseDataDto,
  ResponseDataDto,
  ResponseMetadataDto,
} from "src/helpers/api-dto";
import { Request } from "express";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";
import { PaymentsService } from "../payments/payments.service";
import { DirectChargePaymentDto } from "../payments/dto/payment.dto";
import { MongoIdPipe } from "src/helpers/custom-pipes";

@ApiTags("Subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(
    private paymentsService: PaymentsService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  @ApiOkPaginatedResponse(SubscriptionEntity)
  @ApiOperation({
    summary: "Fetch all subscriptions.",
    description: "Requires authorized user to have an `admin` role access.",
  })
  async findAll(): Promise<PaginatedResponseDataDto<SubscriptionEntity>> {
    const subscriptions = await this.subscriptionsService.findSubscriptions();
    return new PaginatedResponseDataDto({
      page: 1,
      perpage: 10,
      status: HttpStatus.OK,
      data: subscriptions.map(
        (subscription) => new SubscriptionEntity(subscription.toJSON()),
      ),
      message: "Successfully retrieved subscriptions",
    });
  }

  @Get(":id")
  @UseRoles(Role.PROVIDER)
  @ApiCustomOkResponse(SubscriptionEntity)
  @ApiOperation({
    summary: "Fetch provider subscription.",
    description: "Requires authorized user to have an `provider` role access.",
  })
  async findOne(
    @Param("id", MongoIdPipe) subscriptionId: string,
  ): Promise<ResponseDataDto<SubscriptionEntity>> {
    const subscription =
      await this.subscriptionsService.findSubscription(subscriptionId);
    return new ResponseDataDto({
      status: HttpStatus.OK,
      data: new SubscriptionEntity(subscription.toJSON()),
      message: "Successfully retrieved subscription",
    });
  }

  @Post(":id/subscribe")
  @UseRoles(Role.PROVIDER)
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  @ApiOperation({
    summary: "Subscribe to subscription plan.",
    description: "Requires authorized user to have a `provider` role access.",
  })
  async subscribe(
    @Req() request: Request,
    @Param("id", MongoIdPipe) subscriptionPlanId: string,
    @Body() paymentDetails: DirectChargePaymentDto,
  ): Promise<ResponseDataDto<SubscriptionEntity>> {
    const subscriptionPlan =
      await this.subscriptionsService.findOne(subscriptionPlanId);
    const [initializedPayment, chargePayment] =
      await this.paymentsService.initializeAndCharge(
        request,
        paymentDetails,
        subscriptionPlan.price,
      );
    const subscription = await this.subscriptionsService.subscribe(
      request.user.id,
      subscriptionPlanId,
      initializedPayment.id,
    );

    return new ResponseDataDto({
      data: new SubscriptionEntity(subscription.toJSON()),
      message: chargePayment.message,
      status: chargePayment.code,
    });
  }

  @Get("plans")
  @ApiOkPaginatedResponse(SubscriptionEntity)
  @ApiOperation({ summary: "Fetch subscription plans." })
  async findPlans(): Promise<PaginatedResponseDataDto<SubscriptionPlanEntity>> {
    const subscriptionPlans = await this.subscriptionsService.findAll();
    return new PaginatedResponseDataDto({
      page: 1,
      perpage: 10,
      status: HttpStatus.OK,
      data: subscriptionPlans.map(
        (subscription) => new SubscriptionPlanEntity(subscription.toJSON()),
      ),
      message: "Successfully retrieved subscription plans",
    });
  }

  @Post("plans/new")
  @UseRoles(Role.ADMIN)
  @ApiCustomCreatedResponse(SubscriptionPlanEntity)
  @ApiOperation({
    summary: "Create subscription plan.",
    description: "Requires authorized user to have an `admin` role access.",
  })
  async createPlan(
    @Req() request: Request,
    @Body() payload: CreateSubscriptionPlanDto,
  ): Promise<ResponseDataDto<SubscriptionPlanEntity>> {
    const subscriptionPlan = await this.subscriptionsService.create(
      payload,
      request.user.id,
    );

    return new ResponseDataDto({
      data: new SubscriptionPlanEntity(subscriptionPlan.toJSON()),
      message: "Successfully created subscription plan",
      status: HttpStatus.CREATED,
    });
  }

  @Put("plans/:id")
  @UseRoles(Role.ADMIN)
  @ApiCustomOkResponse(SubscriptionPlanEntity)
  @ApiOperation({
    summary: "Update subscription plan.",
    description: "Requires authorized user to have an `admin` role access.",
  })
  async updatePlan(
    @Param("id", MongoIdPipe) subscriptionPlanId: string,
    @Body() payload: UpdateSubscriptionPlanDto,
  ) {
    const subscriptionPlan = await this.subscriptionsService.update(
      subscriptionPlanId,
      payload,
    );
    return new ResponseDataDto({
      data: new SubscriptionPlanEntity(subscriptionPlan.toJSON()),
      message: "Successfully updated subscription plan",
      status: HttpStatus.OK,
    });
  }

  @Get("plans/:id")
  @ApiCustomOkResponse(SubscriptionPlanEntity)
  @ApiOperation({ summary: "Fetch subscription plan details." })
  async findPlan(
    @Param("id", MongoIdPipe) subscriptionPlanId: string,
  ): Promise<ResponseDataDto<SubscriptionPlanEntity>> {
    const subscriptionPlan =
      await this.subscriptionsService.findOne(subscriptionPlanId);

    return new ResponseDataDto({
      data: new SubscriptionPlanEntity(subscriptionPlan.toJSON()),
      message: "Successfully updated subscription plan",
      status: HttpStatus.OK,
    });
  }
}
