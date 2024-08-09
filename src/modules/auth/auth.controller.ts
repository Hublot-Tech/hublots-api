import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  Patch,
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
import { SendOTPDto } from "../otp/dto/otp.dto";
import { CreateUserDto, GoogleSignInDto } from "../users/dto/users.dto";
import { AuthService } from "./auth.service";
import { Public } from "./decorator/auth.decorator";
import {
  AuthTokensDto,
  RefreshTokenDto,
  SignInDto,
  SignInResponseDto,
  SignUpResponseDto,
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
    summary:
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
    summary:
      "Sign up a new user. A successfully sign up will send a OTP to the phone number provided in the registration payload",
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
    summary:
      "Sign up a new user. A successfully sign up will send a OTP to the phone number provided in the registration payload",
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
  @Post("refresh-token")
  @ApiOperation({
    summary: "Request for new access token.",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async requestAccessToken(
    @Body() payload: RefreshTokenDto,
  ): Promise<ResponseDataDto<AuthTokensDto>> {
    const tokens = await this.authService.requestAuthzToken(
      payload.refreshToken,
    );
    return new ResponseDataDto({
      data: tokens,
      status: HttpStatus.CREATED,
      message: "Successfully generate new authorization tokens",
    });
  }

  @Public()
  @Post("resend-code")
  @ApiOperation({
    summary: "Send one time password. Use endpoint to resend OTP if required",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async sendOTP(@Body() otpPayload: SendOTPDto): Promise<ResponseMetadataDto> {
    await this.authService.sendUserOTP(otpPayload);
    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully send user phone number",
    });
  }

  @Patch("verify-code/:code")
  @ApiOperation({
    summary: "Verify one time password sent to user on sign up/in",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async verifyOTP(
    @Req() req: Request,
    @Param("code") otpCode: string,
  ): Promise<ResponseMetadataDto> {
    await this.authService.verifyUserOTP({
      otp: otpCode,
      phoneNumber: req.user.phoneNumber,
    });
    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully verified user phone number",
    });
  }

  @ApiBearerAuth()
  @Delete("/sign-out")
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
    description: "Logout successfully",
  })
  @ApiOperation({ summary: "Sign out." })
  async signOut(@Req() req: Request) {
    await this.authService.signOut(req.user.id);
    return new ResponseMetadataDto({
      message: "Successfully deleted user",
      status: HttpStatus.NO_CONTENT,
    });
  }
}
