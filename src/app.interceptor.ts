import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class AppInterceptor<T> implements NestInterceptor<T, string> {
  private readonly logger = new Logger(AppInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<string> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    this.logger.localInstance.log(request.url, request.method);
    return next.handle().pipe(map((data) => data));
  }
}
