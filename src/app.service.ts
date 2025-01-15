import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Welcome to Hublots Api! visit Public API docs at /api";
  }
}
