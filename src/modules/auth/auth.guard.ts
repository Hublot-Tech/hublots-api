import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Role, VerificationStatus } from "../users/dto";
import { AuthService } from "./auth.service";
import { PUBLIC_KEY, ROLES_KEY } from "./decorator/auth.decorator";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const authzToken = this.authService.extractTokenFromHeader(request);
    const authenticatedUser = await this.authService.authorizeUser(authzToken);

    if (!authenticatedUser.isOTPVerified && !request.url.includes("auth")) {
      throw new ForbiddenException("Phone number not verified");
    }

    if (
      authenticatedUser.kycStatus !== VerificationStatus.VALIDATED &&
      request.url.includes("blots") &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
    ) {
      throw new ForbiddenException(
        "Provider must be KYC'd before managing any blot on the platform",
      );
    }

    const allowedRoles = this.reflector.getAllAndOverride<Role[] | null>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (
      allowedRoles &&
      !allowedRoles.some((r) => authenticatedUser.roles.includes(r))
    ) {
      throw new ForbiddenException("Insufficient privileges");
    }

    request.user = authenticatedUser;
    return true;
  }
}
