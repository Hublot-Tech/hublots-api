import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";
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
  @ApiProperty({ description: "Access token live is 24h" })
  accessToken: string;

  @ApiProperty({
    description:
      "Use refresh token to request of new access token. Refresh token live is 7d",
  })
  refreshToken: string;

  constructor(responseBody: SignInResponseDto) {
    super(responseBody);
    Object.assign(this, responseBody);
  }
}

export class SignUpResponseDto extends UserEntity {
  @ApiProperty({ description: "Access token live is 24h" })
  accessToken: string;

  @ApiProperty({
    description:
      "Use refresh token to request of new access token. Refresh token live is 7d",
  })
  refreshToken: string;

  constructor(data: SignUpResponseDto) {
    super(data);
    Object.assign(this, data);
  }
}

export class AuthGoogleLoginDto {
  idToken: string;
}

export class AuthTokensDto {
  @IsString()
  @ApiProperty({ description: "Access token live is 24h" })
  accessToken: string;

  @IsString()
  @ApiProperty({
    description:
      "Use refresh token to request of new access token. Refresh token live is 7d",
  })
  refreshToken: string;

  constructor(tokens: AuthTokensDto) {
    Object.assign(this, tokens);
  }
}

export class RefreshTokenDto extends PickType(AuthTokensDto, [
  "refreshToken",
]) {}
