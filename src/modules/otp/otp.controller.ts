import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
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
    await this.otpService.sendOTP(otpPayload.phoneNumber);
    return new ResponseMetadataDto({
      status: HttpStatus.CREATED,
      message: "Successfully send one time password",
    });
  }

  @Post("verify")
  @ApiOperation({
    summary:
      "Verify the lastest one time password send to the provider phone number",
  })
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async verifyOTP(
    @Body() otpPayload: VerifyOTPDto,
  ): Promise<ResponseMetadataDto> {
    await this.otpService.verifyOTP(otpPayload.phoneNumber, otpPayload.otp);
    return new ResponseMetadataDto({
      status: HttpStatus.OK,
      message: "Successfully verified one time password",
    });
  }
}
