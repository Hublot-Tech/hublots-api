import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Role, KycStatus } from "../users/dto";
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

    if (user.kycStatus === KycStatus.VALIDATED) {
      throw new UnprocessableEntityException("User has KYC'd already");
    }

    await this.kycModel
      .updateOne(
        { user: userId },
        {
          $set: {
            imageRefs,
            user: userId,
            label: `${user.fullname} <${user.email}>`,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();
    user.kycStatus = KycStatus.SUBMITTED;
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
    const userKYC = await this.kycModel.findById(kycId).exec();
    if (!userKYC)
      throw new NotFoundException(`User kyc with id ${kycId} not found`);
    userKYC.status = kycStatus;
    (userKYC.message = message),
      (userKYC.validatedBy = new Types.ObjectId(validatedBy));
    await this.userModel.updateOne({ _id: userKYC.user }, { kycStatus }).exec();
    await userKYC.save();
  }

  async findAll(query: QueryKYCDto) {
    const kyc = await this.kycModel
      .find({
        ...(query.userId ? { user: query.userId } : undefined),
        ...(query.status ? { status: query.status } : undefined),
      })
      .limit(query.perpage)
      .skip(query.perpage * (query.page - 1))
      .exec();
    return kyc;
  }

  async findOne(kycId: string) {
    const kyc = await this.kycModel
      .findOne({ $or: [{ user: kycId }, { id: kycId }] })
      .sort({ createdAt: -1 })
      .exec();
    if (!kyc) throw new NotFoundException(`KYC with id ${kycId} not found`);
    return kyc;
  }
}
