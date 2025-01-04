import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Role, KycStatus } from "../users/dto";
import { AuthService } from "./auth.service";
import { PUBLIC_KEY, ROLES_KEY } from "./decorator/auth.decorator";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(AuthorizationGuard.name);

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

    if (
      !authenticatedUser.isOTPVerified &&
      !["auth", "profile"].some((path) => request.url.includes(path))
    ) {
      throw new ForbiddenException("Phone number not verified");
    }

    if (
      authenticatedUser.kycStatus !== KycStatus.VALIDATED &&
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
      allowedRoles?.length > 0 &&
      !allowedRoles.some((r) => authenticatedUser.roles.includes(r))
    ) {
      throw new ForbiddenException("Insufficient privileges");
    }

    request.user = authenticatedUser;
    return true;
  }
}
