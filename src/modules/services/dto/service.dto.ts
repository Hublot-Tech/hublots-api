import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Exclude, Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserEntity } from "src/modules/users/dto";
import { OfferEntity } from "../offers/dto/offer.dto";
import { Category } from "../schemas/service.schema";

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

  @Exclude()
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

export class ServiceEntity extends CreateServiceDto {
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

  @ApiProperty({
    example: "Available from 9 AM to 5 PM",
    description: "Availability times for the service",
  })
  @IsOptional()
  @IsString()
  availability: string;

  @IsString()
  @ApiProperty()
  mainImageRef: string;

  @ApiProperty()
  @IsString({ each: true })
  offers: string[];

  @IsString({ each: true })
  @ApiProperty({
    description:
      "Should not be provided on update except one wants to completely override the previous images",
  })
  imageRefs: string[];

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

export class ServiceDetailsDto extends OmitType(ServiceEntity, [
  "provider",
  "offers",
]) {
  @ApiProperty({ type: [OfferEntity] })
  @Transform(({ value }) => value.map((val) => new OfferEntity(val)))
  offers: OfferEntity[];

  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  provider: UserEntity;

  constructor(service: ServiceDetailsDto) {
    super(service);
    Object.assign(this, service);
  }
}
