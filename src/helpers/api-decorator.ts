import { Type, applyDecorators } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { PaginatedResponseDataDto, ResponseDataDto } from "./api-dto";

export const ApiOkPaginatedResponse = <TModel extends Type<any>>(
  model: TModel | string,
) => {
  return applyDecorators(
    ApiExtraModels(
      PaginatedResponseDataDto,
      ...(typeof model == "string" ? [] : [model]),
    ),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDataDto) },
          {
            properties: {
              data: {
                type: "array",
                items:
                  typeof model == "string"
                    ? { type: model }
                    : { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiCustomCreatedResponse = <TModel extends Type<any>>(
  model: TModel | string,
  isArray = false,
) => {
  const dataRef =
    typeof model == "string" ? { type: model } : { $ref: getSchemaPath(model) };
  return applyDecorators(
    ApiExtraModels(
      ResponseDataDto,
      ...(typeof model == "string" ? [] : [model]),
    ),
    ApiCreatedResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDataDto) },
          {
            properties: {
              data: isArray
                ? {
                    type: "array",
                    items: dataRef,
                  }
                : dataRef,
            },
          },
        ],
      },
    }),
  );
};

export const ApiCustomOkResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(ResponseDataDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDataDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};
