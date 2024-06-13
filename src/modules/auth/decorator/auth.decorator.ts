import { SetMetadata } from "@nestjs/common";
import { Role } from "src/modules/users/dto";

export const PUBLIC_KEY = "my_public_key";
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const ROLES_KEY = "roles_key";
export const UseRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
