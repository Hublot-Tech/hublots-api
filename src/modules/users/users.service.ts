import { NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { BulkQueryDto } from "../../helpers/api-dto";
import {
  CreateAccountDto,
  CreateUserDto,
  UpdateProfileDto,
} from "./dto/users.dto";
import { User } from "./schemas/user.schema";

export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async register(userData: CreateUserDto): Promise<User> {
    const newUser = new this.userModel({
      ...userData,
      password: bcrypt.hashSync(
        userData.password,
        parseInt(process.env.BCRYPT_SALT),
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
    const user = await this.userModel.findOne({ email }).exec();
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.userModel.findOne({ phoneNumber }).exec();
    if (!user)
      throw new NotFoundException(
        `User with phone number ${phoneNumber} not found`,
      );
    return user;
  }

  async findAll(query: BulkQueryDto): Promise<User[]> {
    return this.userModel
      .find()
      .limit(query.perpage)
      .skip(query.perpage * (query.page - 1))
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

  async createAcount(account: CreateAccountDto) {
    //FIXME: sent default password to user
    const password = "default-password";
    return this.register({ ...account, password });
  }
}
