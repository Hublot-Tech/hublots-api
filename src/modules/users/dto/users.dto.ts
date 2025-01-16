import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Exclude, Transform } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
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

export enum KycStatus {
  NOT_SUBMITTED = "not_submitted",
  SUBMITTED = "submitted",
  VALIDATED = "validated",
  REJECTED = "rejected",
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
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

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({ description: "Date of birth in ISO8601 format" })
  @Transform(({ value }) => new Date(value))
  date_of_birth?: Date;

  @IsOptional()
  @IsEnum(Gender)
  @ApiProperty({ enum: Gender })
  gender?: Gender;

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
  @IsOptional()
  address: string;

  @ApiProperty({
    example: "Hublot@##*(373#@",
    description: "The name is required to create a new account",
  })
  @IsString()
  @MinLength(3, { message: "Password must be at least 3 characters long" })
  password: string;

  @IsString()
  @IsOptional()
  @ApiHideProperty()
  @Exclude({ toClassOnly: true })
  profileRef?: string;

  @Exclude()
  @ApiPropertyOptional({
    type: String,
    format: "binary",
    description:
      "Binary file to be upload as user profile image. This will be use to populate the `profileRef` field",
  })
  readonly profile?: string;

  constructor(createUser: CreateUserDto) {
    Object.assign(this, createUser);
  }
}

export class UserEntity extends CreateUserDto {
  @Transform(({ value }) => value.toString("hex"))
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

  @IsEnum(KycStatus)
  @ApiProperty({ enum: KycStatus })
  kycStatus: KycStatus = KycStatus.NOT_SUBMITTED;

  @IsBoolean()
  @ApiProperty({ default: true })
  isOnline: boolean = true;

  @IsBoolean()
  @ApiProperty({ default: true })
  isActive: boolean = true;

  @IsBoolean()
  @ApiProperty({ default: false })
  isOTPVerified: boolean = false;

  @ApiProperty()
  @Transform(({ value }) => `${process.env.PUBLIC_URL}/${value}`, {
    toPlainOnly: true,
  })
  profileRef: string = null;

  @Exclude()
  @ApiHideProperty()
  logs: string[];

  constructor(user: UserEntity) {
    super(user);
    Object.assign(this, user);
  }
}

export class CreateAccountDto extends OmitType(CreateUserDto, ["password"]) {
  @ApiProperty({
    example: ["client", "provider"],
    description:
      "The roles property is an array of Roles for the user. Required to create a new account.",
    isArray: true,
    enum: Role,
  })
  @IsEnum(Role, { each: true })
  roles: Role[];

  constructor(props: CreateAccountDto) {
    super(props);
    Object.assign(this, props);
  }
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

  constructor(props: GoogleSignInDto) {
    Object.assign(this, props);
  }
}

export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, ["password", "email"] as const),
) {}
export class UpdateUserDto extends PartialType(CreateAccountDto) {}
