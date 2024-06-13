import { NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { BulkQueryDto } from "../dto/response.dto";
import {
  CreateAccountDto,
  CreateUserDto,
  UpdateProfileDto,
  VerificationStatus,
} from "./dto/users.dto";
import { User } from "./schema/user.schema";
import { Log } from "./schema/log.schema";

export class UsersService {
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async register(userData: CreateUserDto): Promise<User> {
    const newUser = new this.userModel({
      ...userData,
      password: bcrypt.hashSync(
        userData.password,
        parseInt(process.env.SALT_ROUND_DCRIPT),
      ),
    });
    return newUser.save();
  }

  async findOne(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async findAll(query: BulkQueryDto): Promise<User[]> {
    return this.userModel
      .find()
      .limit(query.perpage ?? 10)
      .skip(query.page ?? 1)
      .exec();
  }

  async delete(userId: string): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
  }

  async update(userId: string, data: UpdateProfileDto): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { ...data, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async addKYCImages(userId: string, imageIds: string[]): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    user.kycImages.push(...imageIds.map((id) => new ObjectId(id)));
    user.verificationStatus = VerificationStatus.SUBMITTED;
    return user.save();
  }

  async createAcount(account: CreateAccountDto) {
    //FIXME: sent default password to user
    const password = "default-password";
    return this.register({ ...account, password });
  }

  async createSignInLog(userId: string): Promise<Log> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    const log = await new this.logModel().save();
    user.logs.push(new ObjectId(log._id as string));
    await user.save();
    return log;
  }

  async createSignOutLog(logId: string) {
    await this.logModel
      .findByIdAndUpdate(logId, { logoutAt: new Date() })
      .exec();
  }

  async findUserLog(logId: string): Promise<Log> {
    return this.logModel.findById(logId).exec();
  }
}
