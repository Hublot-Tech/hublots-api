import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ResponseMetadataDto } from "src/helpers/api-dto";
import { SendOTPDto, VerifyOTPDto } from "./dto/otp.dto";
import { OTPService } from "./otp.service";

@ApiTags("OTP")
@ApiBearerAuth()
@Controller("otp")
export class OTPController {
  constructor(private otpService: OTPService) {}

  @Post("send")
  @ApiOperation({
    summary:
      "Send one time password to any phone number, provided the user in login",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async sendOTP(@Body() otpPayload: SendOTPDto): Promise<ResponseMetadataDto> {
    await this.otpService.send(otpPayload.phoneNumber, otpPayload.reason);
    return new ResponseMetadataDto({
      status: HttpStatus.CREATED,
      message: "Successfully send one time password",
    });
  }

  @Post("verify")
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary:
      "Verify the lastest one time password send to the provided phone number.",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async verifyOTP(
    @Body() otpPayload: VerifyOTPDto,
  ): Promise<ResponseMetadataDto> {
    const isVerified = await this.otpService.verify(
      otpPayload.phoneNumber,
      otpPayload.otpCode,
      otpPayload.reason,
    );

    if (!isVerified) {
      throw new UnauthorizedException("Invalid OTP code!");
    }

    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully verified one time password",
    });
  }
}
