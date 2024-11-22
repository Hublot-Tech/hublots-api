import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Role, VerificationStatus } from "../users/dto";
import { User } from "../users/schemas/user.schema";
import { QueryKYCDto, VerifyKYCDto } from "./dto/kyc.dto";
import { KYC } from "./schemas/kyc.schema";

@Injectable()
export class KYCService {
  constructor(
    @InjectModel(KYC.name) private readonly kycModel: Model<KYC>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async submit(userId: string, imageRefs: string[]): Promise<KYC> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (user.kycStatus === VerificationStatus.VALIDATED) {
      throw new UnprocessableEntityException("User has KYC'd already");
    }

    await this.kycModel
      .updateOne(
        { user: userId },
        {
          $set: {
            imageRefs,
            user: userId,
            label: `${user.fullname}`,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();
    user.kycStatus = VerificationStatus.SUBMITTED;
    if (!user.roles.includes(Role.PROVIDER)) {
      user.roles.push(Role.PROVIDER);
    }
    await user.save();
    return await this.kycModel.findOne({ user: userId }).exec();
  }

  async updateStatus(
    kycId: string,
    { status: kycStatus, message }: VerifyKYCDto,
    validatedBy: string,
  ) {
    const user = await this.userModel.findById(kycId);
    if (!user) throw new NotFoundException(`User with id ${kycId} not found`);
    await this.kycModel
      .updateOne(
        { id: kycId },
        { status: kycStatus, message, user: user.id, validatedBy },
      )
      .exec();
    user.kycStatus = kycStatus;
    await user.save();
  }

  async findAll(query: QueryKYCDto) {
    return this.kycModel
      .find({ user: query.userId, status: query.status })
      .limit(query.perpage)
      .skip(query.perpage * (query.page - 1))
      .exec();
  }
}
