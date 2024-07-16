import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { AxiosError } from "axios";
import { MongoError } from "mongodb";
import { MongooseError } from "mongoose";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    Logger.error(exception, AllExceptionsFilter.name);
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let errorMessage = "Ooops, unexpected exception occured.";
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      errorMessage = exception.getResponse()["message"];
      httpStatus = exception.getStatus();
    } else if (
      exception instanceof MongoError ||
      exception instanceof MongooseError
    ) {
      errorMessage = exception.message;
      httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof AxiosError) {
      // Handle Axios-specific errors
      const { status, data } = exception.response;
      errorMessage = data["message"] ?? data["error"] ?? exception.message;
      httpStatus = status;
    } else {
      errorMessage =
        exception["message"] ??
        exception["error"] ??
        exception.toString() ??
        errorMessage;
    }

    const responseBody = {
      message: errorMessage,
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
