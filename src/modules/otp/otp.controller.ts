import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { OTPService } from "./otp.service";
import { ApiNoContentResponse, ApiTags } from "@nestjs/swagger";
import { ResponseMetadataDto } from "src/helpers/api-dto";
import { SendOTPDto, VerifyOTPDto } from "./dto/otp.dto";
import { Public } from "../auth/decorator/auth.decorator";

@ApiTags("OTP")
@Controller("otp")
export class OTPController {
  constructor(private otpService: OTPService) {}

  @Post("send")
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async sendOTP(@Body() otpPayload: SendOTPDto): Promise<ResponseMetadataDto> {
    await this.otpService.sendOTP(otpPayload.phoneNumber);
    return new ResponseMetadataDto({
      status: HttpStatus.CREATED,
      message: "Successfully send one time password",
    });
  }

  @Public()
  @Post("verify")
  @ApiNoContentResponse({ type: ResponseMetadataDto })
  async verifyOTP(
    @Body() otpPayload: VerifyOTPDto,
  ): Promise<ResponseMetadataDto> {
    await this.otpService.verifyOTP(otpPayload.phoneNumber, otpPayload.otp);
    return new ResponseMetadataDto({
      status: HttpStatus.CREATED,
      message: "Successfully verified one time password",
    });
  }
}
