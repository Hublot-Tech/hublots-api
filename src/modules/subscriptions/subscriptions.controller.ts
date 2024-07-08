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
import { ApiTags } from "@nestjs/swagger";
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
import { PaginatedResponseDataDto, ResponseDataDto } from "src/helpers/api-dto";
import { Request } from "express";
import { UseRoles } from "../auth/decorator/auth.decorator";
import { Role } from "../users/dto";

@ApiTags("Subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOkPaginatedResponse(SubscriptionEntity)
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
  @ApiCustomOkResponse(SubscriptionEntity)
  async findOne(
    @Param("id") subscriptionId: string,
  ): Promise<ResponseDataDto<SubscriptionEntity>> {
    const subscription =
      await this.subscriptionsService.findSubscription(subscriptionId);
    return new ResponseDataDto({
      status: HttpStatus.OK,
      data: new SubscriptionEntity(subscription.toJSON()),
      message: "Successfully retrieved subscription",
    });
  }

  @Put(":id/subscribe")
  @UseRoles(Role.PROVIDER)
  @ApiCustomOkResponse(SubscriptionEntity)
  async subscribe(
    @Req() request: Request,
    @Param("id") subscriptionPlanId: string,
  ): Promise<ResponseDataDto<SubscriptionEntity>> {
    const subscription = await this.subscriptionsService.subscribe(
      request.user.id,
      subscriptionPlanId,
    );

    return new ResponseDataDto({
      data: new SubscriptionEntity(subscription.toJSON()),
      message: "Successfully subscribed to plan",
      status: HttpStatus.OK,
    });
  }

  @Get("plans")
  @ApiOkPaginatedResponse(SubscriptionEntity)
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
  async updatePlan(
    @Param("id") subscriptionPlanId: string,
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
  async findPlan(
    @Param(":id") subscriptionPlanId: string,
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
