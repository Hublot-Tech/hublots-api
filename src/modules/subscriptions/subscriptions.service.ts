import { Model } from "mongoose";
import { Subscription } from "./schemas/subscription.schema";
import {
  SubscriptionPlan,
  SubscriptionPlanType,
} from "./schemas/subscription-plan.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from "./dto/subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlan>,
  ) {}

  async create(payload: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const newSubscription = new this.subscriptionPlanModel(payload);
    return newSubscription.save();
  }

  async findOne(subscriptionId: string): Promise<SubscriptionPlan> {
    const subscriptionPlan = await this.subscriptionPlanModel
      .findById(subscriptionId)
      .exec();
    if (!subscriptionPlan)
      throw new NotFoundException(`User with id ${subscriptionId} not found`);
    return subscriptionPlan;
  }

  async findAll(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanModel.find().exec();
  }

  async update(
    subscriptionId: string,
    data: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.subscriptionPlanModel
      .findByIdAndUpdate(
        subscriptionId,
        { ...data, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async subscribe(
    subscriber: string,
    subscriptionPlanId: string,
  ): Promise<Subscription> {
    const subscriptionPlan = await this.subscriptionPlanModel
      .findById(subscriptionPlanId)
      .exec();
    if (!subscriptionPlan)
      throw new NotFoundException(
        `Subscription plan with id ${subscriptionPlanId} not found`,
      );

    const endsAt =
      Date.now() +
      (subscriptionPlan.type === SubscriptionPlanType.ANNUAL ? 365 : 30) *
        86400000;

    const newSubscription = new this.subscriptionModel({
      endsAt,
      subscriber: subscriber,
      subscriptionPlan: subscriptionPlanId,
      ...subscriptionPlan.toJSON(),
    });

    return newSubscription.save();
  }
}
