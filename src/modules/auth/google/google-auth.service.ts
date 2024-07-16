import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { GoogleSignInDto } from "../../users/dto/users.dto";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleAuthService {
  private google: OAuth2Client;

  constructor(private readonly authService: AuthService) {
    this.google = new OAuth2Client(
      process.env.AUTH_GOOGLE_CLIENT_ID,
      process.env.AUTH_GOOGLE_CLIENT_SECRET,
    );
  }

  async getProfileByToken(loginDto: GoogleSignInDto) {
    const ticket = await this.google.verifyIdToken({
      idToken: loginDto.idToken,
      audience: [process.env.AUTH_GOOGLE_CLIENT_ID],
    });

    const data = ticket.getPayload();

    if (!data) {
      throw new UnprocessableEntityException(
        "Could not process id token payload",
      );
    }

    return this.authService.authenticateUser(data);
  }
}
