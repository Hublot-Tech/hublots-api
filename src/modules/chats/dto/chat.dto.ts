import { IsEnum, IsString } from "class-validator";
import { MsgContentType } from "../schemas/chat.schema";
import { ApiHideProperty, ApiProperty, OmitType } from "@nestjs/swagger";
import { UserEntity } from "src/modules/users/dto";
import { BulkQueryDto } from "src/helpers/api-dto";

export class CreateMessageDto {
  @IsString()
  @ApiProperty()
  content: string;

  @IsEnum(MsgContentType)
  @ApiProperty({ enum: MsgContentType })
  contentType: MsgContentType;

  @IsString()
  @ApiProperty({ type: "Mesage receiver ID" })
  receiver: string;

  constructor(message: CreateMessageDto) {
    Object.assign(this, message);
  }
}

export class MessageEntity extends CreateMessageDto {
  @ApiProperty()
  sender: string;

  @ApiProperty({ type: Date })
  sentAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  deliveredAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  readAt: Date | null;

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
  sender: UserEntity;

  @ApiProperty({ type: UserEntity })
  receiver: UserEntity;

  constructor(message: MessageDetailsDto) {
    super(message);
    Object.assign(this, message);
  }
}

export class MessageQueryParamsDto extends BulkQueryDto {
  @IsString()
  @ApiProperty()
  receiver: string;

  @ApiHideProperty()
  sender: string;

  constructor(params: MessageQueryParamsDto) {
    super(params);
    Object.assign(this, params);
  }
}
