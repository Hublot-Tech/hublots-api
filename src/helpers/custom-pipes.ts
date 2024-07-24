import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { isMongoId } from "class-validator";

@Injectable()
export class MongoIdPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isMongoId(value)) {
      throw new BadRequestException(`${value} is not a valid MongoDB ObjectID`);
    }
    return value;
  }
}
