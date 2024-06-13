import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Role } from "../users/dto";
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

    const authenticatedUser = await this.authService.authorizeUser(request);

    const allowedRoles = this.reflector.getAllAndOverride<Role[] | null>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (
      allowedRoles &&
      !allowedRoles.some((r) => authenticatedUser.roles.includes(r))
    ) {
      throw new UnauthorizedException();
    }

    request.user = authenticatedUser;
    return true;
  }
}
