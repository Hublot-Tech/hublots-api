import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ArrayMaxSize, IsEnum, IsString } from "class-validator";
import { BulkQueryDto } from "src/helpers/api-dto";
import { UserEntity } from "src/modules/users/dto";
import { MsgContentType } from "../schemas/chat.schema";
import { Transform } from "class-transformer";

export class CreateMessageDto {
  @IsString()
  @ApiProperty()
  content: string;

  @IsEnum(MsgContentType)
  @ApiProperty({ enum: MsgContentType })
  contentType: MsgContentType;

  @IsString()
  @ApiProperty({ type: String })
  receiver: string;

  constructor(message: CreateMessageDto) {
    Object.assign(this, message);
  }
}

export class MessageEntity extends CreateMessageDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString("hex"))
  id: string;

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
  @ArrayMaxSize(2)
  @IsString({ each: true })
  @ApiProperty({ description: "Should not provide more than 02 interlocutors" })
  interlocutors: string[];

  constructor(params: MessageQueryParamsDto) {
    super(params);
    Object.assign(this, params);
  }
}
