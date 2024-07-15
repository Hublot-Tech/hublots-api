import { HttpStatus } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class BulkQueryDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  perpage: number = 10;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  page: number = 1;

  constructor(query: BulkQueryDto) {
    Object.assign(this, query);
  }
}

export class ResponseMetadataDto {
  @IsString()
  @ApiProperty()
  message: string;

  @IsEnum(HttpStatus)
  @ApiProperty({ enum: HttpStatus })
  status: HttpStatus;

  constructor(responseBody: ResponseMetadataDto) {
    Object.assign(this, responseBody);
  }
}

export class ResponseDataDto<TData> extends ResponseMetadataDto {
  data: TData;

  constructor(data: ResponseDataDto<TData>) {
    super(data);
    Object.assign(this, data);
  }
}

export class PaginatedResponseDataDto<TData> extends ResponseMetadataDto {
  @IsNumber()
  @ApiProperty()
  perpage: number;

  @IsNumber()
  @ApiProperty()
  page: number;

  data: TData[];

  constructor(data: PaginatedResponseDataDto<TData>) {
    super(data);
    Object.assign(this, data);
  }
}
