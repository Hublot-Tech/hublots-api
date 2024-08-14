import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Exclude, Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { UserEntity } from "src/modules/users/dto";
import { Category } from "../schemas/service.schema";
import {
  CreatePlaceDto,
  PlaceEntity,
  PlaceQueryParams,
} from "src/modules/places/dto/place.dto";

export class CreateServiceDto {
  @ApiProperty({
    example: "Plomberie et sanitaire",
    description: "Name of the service",
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: "Nettoyage des canalisations, installation de robinetterie, etc.",
    description: "Description of the service",
  })
  @IsString()
  @MinLength(30)
  description: string;

  @IsEnum(Category)
  @ApiProperty({ enum: Category, description: "Service category" })
  category: Category;

  //referencing the user who created the service
  @ApiPropertyOptional({
    example: "60e1f9f1c3c7b40015f7c4b5",
    description: "User ID of the service provider",
  })
  @IsString()
  @IsOptional()
  provider: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePlaceDto)
  @Transform(({ value }) => new CreatePlaceDto(JSON.parse(value)))
  @ApiPropertyOptional({
    description: "Address where the service will be provided",
    type: CreatePlaceDto,
  })
  place: CreatePlaceDto;

  @Exclude({ toClassOnly: true })
  @ApiHideProperty()
  mainImageRef: string;

  @Exclude()
  @ApiPropertyOptional({
    type: String,
    format: "binary",
    description:
      "Binary file to be upload as service main image. This will be use to populate the `mainImageRef` field",
  })
  readonly file: string;

  constructor(createService: CreateServiceDto) {
    Object.assign(this, createService);
  }
}

export class ServiceEntity extends OmitType(CreateServiceDto, ["place"]) {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty({
    description: "Timestamp of last update",
  })
  updatedAt: Date;

  @ApiProperty({ default: () => Date.now() })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp of deletion",
  })
  deletedAt: Date;

  @ApiPropertyOptional({
    example: "Available from 9 AM to 5 PM",
    description: "Availability times for the service",
  })
  @IsOptional()
  @IsString()
  availability: string;

  @ApiProperty()
  mainImageRef: string;

  @ApiProperty({
    description:
      "Should not be provided on update except one wants to completely override the previous images",
  })
  imageRefs: string[];

  @ApiProperty({ type: String, nullable: true })
  @Transform(({ value }) => new PlaceEntity(value))
  place: PlaceEntity;

  @Exclude()
  @ApiHideProperty()
  createdBy: string;

  constructor(service: ServiceEntity) {
    super(service);
    Object.assign(this, service);
  }
}

export class UpdateServiceDto extends PartialType(
  PickType(ServiceEntity, [
    "name",
    "description",
    "mainImageRef",
    "imageRefs",
  ] as const),
) {}

export class ServiceDetailsDto extends OmitType(ServiceEntity, ["provider"]) {
  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  provider: UserEntity;

  constructor(service: ServiceDetailsDto) {
    super(service);
    Object.assign(this, service);
  }
}

export class ServiceParamsDto extends IntersectionType(
  BulkQueryDto,
  PlaceQueryParams,
) {
  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional()
  createdBy?: string;

  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional()
  provider?: string;

  @IsOptional()
  @IsEnum(Category)
  @ApiPropertyOptional({ enum: Category, description: "Service category" })
  category?: Category;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: "Search string" })
  keywords: string;

  constructor(search: ServiceParamsDto) {
    super(search);
    Object.assign(this, search);
  }
}
