import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VerificationStatus } from "../users/dto";
import { User } from "../users/schemas/user.schema";
import { VerifyKYCDto } from "./dto/kyc.dto";
import { KYC } from "./schemas/kyc.schema";

@Injectable()
export class KYCService {
  constructor(
    @InjectModel(KYC.name) private readonly kycModel: Model<KYC>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async submit(userId: string, imageRefs: string[]): Promise<KYC> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    await this.kycModel
      .updateOne({ user: user.id, isNew: true }, { imageRefs, user: user.id })
      .exec();
    user.verificationStatus = VerificationStatus.SUBMITTED;
    await user.save();
    return this.kycModel.findOne({ user: userId }).exec();
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
    user.verificationStatus = kycStatus;
    await user.save();
    return this.kycModel.findOne({ user: kycId }).exec();
  }
}
