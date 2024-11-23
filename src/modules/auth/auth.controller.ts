import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { ApiCustomCreatedResponse } from "src/helpers/api-decorator";
import { ResponseDataDto, ResponseMetadataDto } from "src/helpers/api-dto";
import { SendOTPDto, VerifyOTPDto } from "../otp/dto/otp.dto";
import { CreateUserDto, GoogleSignInDto } from "../users/dto/users.dto";
import { AuthService } from "./auth.service";
import { Public } from "./decorator/auth.decorator";
import {
  AuthTokensDto,
  PasswordPayloadDto,
  RefreshTokenDto,
  SignInDto,
  SignInResponseDto,
  SignUpResponseDto,
} from "./dto/auth.dto";
import { GoogleAuthService } from "./google/google-auth.service";

@Public()
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private authGuard: GoogleAuthService,
  ) {}

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

  @Post("register")
  @ApiOperation({
    summary:
      "Sign up a new user. A successfully sign up will send a OTP to the phone number provided in the registration payload",
  })
  @ApiCustomCreatedResponse(SignUpResponseDto)
  @ApiBody({ type: CreateUserDto })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("profile"))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ResponseDataDto<SignUpResponseDto>> {
    const { user, ...tokens } = await this.authService.singUp(createUserDto);
    return new ResponseDataDto({
      data: new SignUpResponseDto({ ...user.toJSON(), ...tokens }),
      status: HttpStatus.CREATED,
      message: "Successfully register user",
    });
  }

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

  @Post("resend-code")
  @ApiOperation({
    summary: "Send one time password. Use endpoint to resend OTP if required",
    description:
      "Use endpoint to resend OTP if required. This endpoint can also be used to send reset-password otp",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async sendOTP(@Body() otpPayload: SendOTPDto): Promise<ResponseMetadataDto> {
    await this.authService.sendUserOTP(otpPayload);
    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully send user phone number",
    });
  }

  @Public(false)
  @Post("verify-phone-number")
  @ApiOperation({
    summary: "Verify one time password sent to user on sign up/in",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async verifyOTP(
    @Body() otpPayload: VerifyOTPDto,
  ): Promise<ResponseMetadataDto> {
    await this.authService.verifyUserOTP(otpPayload);

    return new ResponseMetadataDto({
      message: "Successfully verified user phone number",
      status: HttpStatus.NO_CONTENT,
    });
  }

  @Post("/new-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  @ApiOperation({ summary: "Update user password." })
  async setNewPassword(@Body() passwordPayload: PasswordPayloadDto) {
    await this.authService.updateUserPassword(passwordPayload);

    return new ResponseMetadataDto({
      message: "Successfully changed user password",
      status: HttpStatus.NO_CONTENT,
    });
  }

  @Public(false)
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
