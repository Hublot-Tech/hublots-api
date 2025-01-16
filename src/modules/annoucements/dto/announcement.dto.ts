import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Role, UserEntity } from "src/modules/users/dto";

export class CreateAnnouncementDto {
  @ApiProperty({ description: "The announcement public target " })
  @IsIn(Object.values(Role))
  target: Role[];

  @IsNumber()
  @ApiProperty({ description: "Announcement duration in hours" })
  duration: number;

  @IsDateString()
  @ApiProperty({
    description: "Date to start show the annoucement",
    default: () => Date.now(),
  })
  startsAt: Date;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      "The field is required when announcement is created by Customer service",
  })
  provider: string;

  @IsString()
  @ApiProperty({
    description:
      "ID of the payment intented for announcement you what to create",
  })
  paymentId: string;

  @IsString()
  @ApiHideProperty()
  @Transform(({ value }) => `${process.env.PUBLIC_URL}/${value}`, {
    toPlainOnly: true,
  })
  imageRef: string;

  constructor(announcement: CreateAnnouncementDto) {
    Object.assign(this, announcement);
  }
}

export class UpdateAnnouncementDto extends PartialType(
  OmitType(CreateAnnouncementDto, ["provider", "paymentId"]),
) {}

export class AnnouncementEntity extends CreateAnnouncementDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty({ default: () => Date.now() })
  createdAt: Date;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  createdBy: string;

  constructor(announcement: AnnouncementEntity) {
    super(announcement);
    Object.assign(this, announcement);
  }
}

export class AnnouncementDetailsDto extends OmitType(AnnouncementEntity, [
  "provider",
]) {
  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  provider: UserEntity;

  constructor(announcement: AnnouncementDetailsDto) {
    super(announcement);
    Object.assign(this, announcement);
  }
}
