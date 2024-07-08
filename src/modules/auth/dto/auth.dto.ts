import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsJWT, IsString, Length } from "class-validator";
import { ResponseMetadataDto } from "src/helpers/api-dto";
import { UserEntity } from "src/modules/users/dto";

export class SignInDto {
  @ApiProperty({
    description: "Email utilisé pour créer le compte",
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Password used to create account",
    required: true,
  })
  @IsString()
  password: string;
}

export class SignInResponseDto extends ResponseMetadataDto {
  @ApiProperty({
    description: "Valid access token",
    required: true,
  })
  @IsJWT()
  accessToken: string;

  constructor(responseBody: SignInResponseDto) {
    super(responseBody);
    Object.assign(this, responseBody);
  }
}

export class SignUpResponseDto extends UserEntity {
  @ApiProperty({
    description: "Valid access token",
    required: true,
  })
  accessToken: string;

  constructor(data: SignUpResponseDto) {
    super(data);
    Object.assign(this, data);
  }
}

export class AuthGoogleLoginDto {
  idToken: string;
}

export class VerifyOTPDto {
  @IsString()
  @ApiProperty()
  phoneNumber: string;

  @Length(5)
  @IsString()
  @ApiProperty()
  otp: string;

  constructor(otp: VerifyOTPDto) {
    Object.assign(this, otp);
  }
}
