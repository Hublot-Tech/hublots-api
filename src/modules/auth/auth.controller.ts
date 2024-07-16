import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { ApiCustomCreatedResponse } from "src/helpers/api-decorator";
import { ResponseDataDto, ResponseMetadataDto } from "src/helpers/api-dto";
import { CreateUserDto, GoogleSignInDto } from "../users/dto/users.dto";
import { AuthService } from "./auth.service";
import { Public } from "./decorator/auth.decorator";
import {
  AuthTokensDto,
  SignInDto,
  SignInResponseDto,
  SignUpResponseDto,
  VerifyOTPDto,
} from "./dto/auth.dto";
import { GoogleAuthService } from "./google/google-auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private authGuard: GoogleAuthService,
  ) {}

  @Public()
  @Post("login")
  @ApiCreatedResponse({
    type: SignInResponseDto,
    description: "User Successfully signed in",
  })
  @ApiOperation({
    description:
      "Sign in. A successfully sign in will send a OTP to user phone number if not verified yet",
  })
  async signIn(@Body() signInDto: SignInDto): Promise<SignInResponseDto> {
    const tokens = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );
    return new SignInResponseDto({
      ...tokens,
      message: "User Successfully signed in",
      status: HttpStatus.OK,
    });
  }

  @Public()
  @Post("google-login")
  @ApiCreatedResponse({
    type: SignInResponseDto,
    description: "Successful user registration",
  })
  @ApiOperation({
    description:
      "Sign up a new user. A successfully sign up will send a OTP to the phone number provied in the registration payload",
  })
  async googleSignIn(
    @Body() signInDto: GoogleSignInDto,
  ): Promise<SignInResponseDto> {
    const tokens = await this.authGuard.getProfileByToken(signInDto);
    return new SignInResponseDto({
      ...tokens,
      message: "Successfully signed user in",
      status: HttpStatus.OK,
    });
  }

  @Public()
  @Post("register")
  @ApiOperation({
    description:
      "Sign up a new user. A successfully sign up will send a OTP to the phone number provied in the registration payload",
  })
  @ApiCustomCreatedResponse(SignUpResponseDto)
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ResponseDataDto<SignUpResponseDto>> {
    const { user, ...tokens } = await this.authService.singUp(createUserDto);
    return new ResponseDataDto({
      data: new SignUpResponseDto({ ...user.toJSON(), ...tokens }),
      status: HttpStatus.CREATED,
      message: "Successfully register user",
    });
  }

  @Public()
  @Post("verify-otp")
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async verifyOTP(
    @Body() otpPayload: VerifyOTPDto,
  ): Promise<ResponseMetadataDto> {
    await this.authService.verifyOTP(otpPayload);
    return new ResponseMetadataDto({
      status: HttpStatus.CREATED,
      message: "Successfully verified one time password",
    });
  }

  @Public()
  @Post("refresh-token")
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async requestAccessToken(
    @Body("refreshToken") refreshToken: string,
  ): Promise<ResponseDataDto<AuthTokensDto>> {
    const tokens = await this.authService.requestAuthzToken(refreshToken);
    return new ResponseDataDto({
      data: tokens,
      status: HttpStatus.CREATED,
      message: "Successfully generate new authorization tokens",
    });
  }

  @ApiBearerAuth()
  @Delete("/sign-out")
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
    description: "Logout successfully",
  })
  async signOut(@Req() req: Request) {
    await this.authService.signOut(req);
    return new ResponseMetadataDto({
      message: "Successfully deleted user",
      status: HttpStatus.NO_CONTENT,
    });
  }
}
