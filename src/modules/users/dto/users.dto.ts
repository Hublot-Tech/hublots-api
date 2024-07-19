import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";

export enum Locale {
  FR = "fr",
  EN_US = "en-US",
}

export enum Role {
  CLIENT = "client",
  PROVIDER = "provider",
  PARTNER = "partner",
  SUPPORT = "support",
  ADMIN = "admin",
}

export enum VerificationStatus {
  NOT_SUBMITTED = "not_submitted",
  SUBMITTED = "submitted",
  VERIFIED = "verified",
  NOT_VERIFIED = "not_verified",
}

export class CreateUserDto {
  @ApiProperty({
    example: "Wonder",
    description: "The name is required to create a new account",
  })
  @IsString({ message: "Fullname is required" })
  @MinLength(3, { message: "Name must be at least 3 characters long" })
  fullname: string;

  @ApiProperty({
    example: "wonder@gmail.com",
    description: "The email is required to create a new account",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "237 693 xxx xxx",
    description: "The phoneNumber is required to create a new account",
  })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    example: "FR",
    description:
      "The locale is the default language of the user. Required to create a new account",
  })
  @IsOptional()
  @IsEnum(Locale)
  locale: Locale = Locale.FR;

  @ApiProperty({
    example: "Lobbessou",
    description: "The address is required to create a new account",
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: "Hublot@##*(373#@",
    description: "The name is required to create a new account",
  })
  @IsString()
  @MinLength(3, { message: "Password must be at least 3 characters long" })
  password: string;

  constructor(createUser: CreateUserDto) {
    Object.assign(this, createUser);
  }
}

export class UserEntity extends CreateUserDto {
  @IsUUID()
  @ApiProperty()
  id: string;

  @ApiProperty({
    description: "Timestamp of last update",
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({ default: () => Date.now() })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp of deletion",
  })
  @IsDateString()
  deletedAt: Date;

  @ApiProperty({
    example: ["CLIENT", "PROVIDER"],
    description:
      "The roles property is an array of Roles for the user. Required to create a new account.",
    isArray: true,
    enum: Role,
  })
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsEnum(VerificationStatus)
  @ApiProperty({ enum: VerificationStatus })
  verificationStatus: VerificationStatus = VerificationStatus.NOT_SUBMITTED;

  @IsBoolean()
  @ApiProperty({ default: true })
  isOnline: boolean = true;

  @IsBoolean()
  @ApiProperty({ default: true })
  isActive: boolean = true;

  @IsBoolean()
  @ApiProperty({ default: false })
  isOTPVerified: boolean = false;

  constructor(user: UserEntity) {
    super(user);
    Object.assign(this, user);
  }
}

export class CreateAccountDto extends OmitType(CreateUserDto, ["password"]) {
  @ApiProperty({
    example: ["CLIENT", "PROVIDER"],
    description:
      "The roles property is an array of Roles for the user. Required to create a new account.",
    isArray: true,
    enum: Role,
  })
  @IsEnum(Role, { each: true })
  roles: Role[];
}

export class GoogleSignInDto {
  @ApiProperty({
    description: "Id token",
  })
  @IsString()
  idToken: string;

  @ApiProperty({
    description: "Network used for connection",
  })
  @IsString()
  socialMode: string;
}

export class UpdateProfileDto extends PartialType(
  OmitType(UserEntity, ["password", "email", "roles"] as const),
) {}
export class UpdateUserDto extends PartialType(
  OmitType(UserEntity, ["password", "email"] as const),
) {}
