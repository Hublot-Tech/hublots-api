import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserEntity } from "src/modules/users/dto";
import { OfferEntity } from "../offers/dto/offer.dto";
import { Category } from "../schemas/service.schema";
import { Exclude } from "class-transformer";

export class CreateServiceDto {
  @ApiProperty({
    example: "Plomberie et sanitaire",
    description: "Name of the service",
  })
  @IsString({ message: "name is required" })
  @MinLength(3, { message: "Service Name must be at least 3 characters long" })
  name: string;

  @ApiProperty({
    example: "Nettoyage des canalisations, installation de robinetterie, etc.",
    description: "Description of the service",
  })
  @IsString({ message: "Service description is required" })
  @MinLength(30, { message: "description must be at least 40 characters long" })
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
      "Binary file to be upload as service main image. This will be use to populate the mainImageRef",
  })
  readonly file: string;

  constructor(createService: CreateServiceDto) {
    Object.assign(this, createService);
  }
}

export class ServiceEntity extends CreateServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    description: "Timestamp of last update",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Timestamp of creation",
  })
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

  constructor(service: ServiceEntity) {
    super(service);
    Object.assign(this, service);
  }
}

export class UpdateServiceDto extends PartialType(
  PickType(ServiceEntity, ["name", "description"] as const),
) {}

export class ServiceDetailsDto extends OmitType(ServiceEntity, ["provider"]) {
  @ApiProperty({ type: [OfferEntity] })
  offers: OfferEntity[];

  @ApiProperty({ type: UserEntity })
  provider: UserEntity;

  constructor(service: ServiceDetailsDto) {
    super(service);
    Object.assign(this, service);
  }
}
