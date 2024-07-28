import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Exclude, Transform } from "class-transformer";
import { ArrayMinSize, IsEnum, IsOptional, IsString } from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { UserEntity } from "src/modules/users/dto";
import { MsgContentType } from "../schemas/message.schema";

export class CreateMessageDto {
  @IsEnum(MsgContentType)
  @ApiProperty({ enum: MsgContentType })
  contentType: MsgContentType;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Must be present when content type is text",
  })
  content: string;

  @IsString()
  @ApiProperty({ type: String })
  receiver: string;

  @Exclude({ toClassOnly: true })
  @ApiHideProperty()
  fileRef: string;

  @Exclude()
  @ApiPropertyOptional({
    type: String,
    format: "binary",
    description:
      "Binary file to be upload as message. This will be use to populate the `fileRef` field",
  })
  readonly file: string;

  constructor(message: CreateMessageDto) {
    Object.assign(this, message);
  }
}

export class UpdateMessageDto extends PickType(PartialType(CreateMessageDto), [
  "content",
  "fileRef",
  "file",
]) {}

export class MessageEntity extends CreateMessageDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

  @ApiProperty()
  sender: string;

  @ApiProperty({ type: Date })
  sentAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  deliveredAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  readAt: Date;

  @ApiProperty({ description: "Only present if content type is file" })
  fileRef: string;

  constructor(message: MessageEntity) {
    super(message);
    Object.assign(this, message);
  }
}

export class MessageDetailsDto extends OmitType(MessageEntity, [
  "sender",
  "receiver",
]) {
  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  sender: UserEntity;

  @ApiProperty({ type: UserEntity })
  @Transform(({ value }) => new UserEntity(value))
  receiver: UserEntity;

  constructor(message: MessageDetailsDto) {
    super(message);
    Object.assign(this, message);
  }
}

export class MessageQueryParamsDto extends BulkQueryDto {
  @ArrayMinSize(1)
  @IsString({ each: true })
  @ApiProperty({ description: "Should not provide more than 02 interlocutors" })
  interlocutors: string[];

  constructor(params: MessageQueryParamsDto) {
    super(params);
    Object.assign(this, params);
  }
}
