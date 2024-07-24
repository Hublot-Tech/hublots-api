import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Req,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
} from "src/helpers/api-decorator";
import { ResponseDataDto, ResponseMetadataDto } from "src/helpers/api-dto";
import { MongoIdPipe } from "src/helpers/custom-pipes";
import { UseRoles } from "src/modules/auth/decorator/auth.decorator";
import { Role } from "src/modules/users/dto";
import { CreateOfferItemDto } from "./dto/ofer-item.dto";
import {
  CreateOfferDto,
  OfferDetailsDto,
  OfferEntity,
  UpdateOfferDto,
} from "./dto/offer.dto";
import { OffersService } from "./offers.service";

@ApiBearerAuth()
@ApiTags("Service Offers")
@Controller("services/offers")
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get(":id")
  @ApiCustomOkResponse(OfferDetailsDto)
  @ApiOperation({ summary: "Fetch service offer." })
  async finOne(
    @Param("id", MongoIdPipe) offerId: string,
  ): Promise<ResponseDataDto<OfferDetailsDto>> {
    const offer = await this.offersService.findOne(offerId);
    return new ResponseDataDto({
      data: new OfferDetailsDto(offer.toJSON()),
      message: "Offer retrieve successfully",
      status: HttpStatus.OK,
    });
  }

  @Post("new")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomCreatedResponse(OfferEntity)
  @ApiOperation({
    summary: "Create service offer.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the offer",
  })
  async createOffer(
    @Req() request: Request,
    @Body() payload: CreateOfferDto,
  ): Promise<ResponseDataDto<OfferEntity>> {
    const newOffer = await this.offersService.create(payload, request.user.id);
    return new ResponseDataDto({
      data: new OfferEntity(newOffer.toJSON()),
      message: "Offer created successfully",
      status: HttpStatus.CREATED,
    });
  }

  @Post("bulk-insert")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomCreatedResponse(OfferEntity, true)
  @ApiBody({ type: [CreateOfferDto] })
  @ApiOperation({
    summary: "Create multiple service offers.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the offer",
  })
  async createManyOffers(
    @Req() request: Request,
    @Body(new ParseArrayPipe({ items: CreateOfferDto }))
    payload: CreateOfferDto[],
  ): Promise<ResponseDataDto<OfferEntity[]>> {
    const newOffers = await this.offersService.bulkCreate(
      payload,
      request.user.id,
    );
    return new ResponseDataDto({
      data: newOffers.map((newOffer) => new OfferEntity(newOffer.toJSON())),
      message: "All offers created successfully",
      status: HttpStatus.CREATED,
    });
  }

  @Put(":id")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomOkResponse(OfferEntity)
  @ApiOperation({
    summary: "Update service offer.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the offer",
  })
  async updateOffer(
    @Req() request: Request,
    @Param("id", MongoIdPipe) offerId: string,
    @Body() payload: UpdateOfferDto,
  ): Promise<ResponseDataDto<OfferEntity>> {
    const updatedOffer = await this.offersService.update(
      offerId,
      payload,
      request.user.id,
    );
    return new ResponseDataDto({
      data: new OfferEntity(updatedOffer.toJSON()),
      message: "Offer updated successfully",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
  })
  @ApiOperation({
    summary: "Delete service offer.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the offer",
  })
  async deleteOffer(
    @Req() request: Request,
    @Param("id", MongoIdPipe) offerId: string,
  ): Promise<ResponseMetadataDto> {
    await this.offersService.delete(offerId, request.user.id);
    return new ResponseMetadataDto({
      message: "Offer deleted successfully",
      status: HttpStatus.OK,
    });
  }

  @Post(":id/items")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomOkResponse(OfferDetailsDto)
  @ApiOperation({
    summary: "Add new offer items.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the offer",
  })
  async addedOfferItems(
    @Req() request: Request,
    @Param("id", MongoIdPipe) offerId: string,
    @Body(new ParseArrayPipe({ items: CreateOfferItemDto }))
    payload: CreateOfferItemDto[],
  ): Promise<ResponseDataDto<OfferDetailsDto>> {
    if (!payload.length) {
      throw new UnprocessableEntityException(
        "Expected at least one offer item",
      );
    }
    const updatedOffer = await this.offersService.addItems(
      offerId,
      payload,
      request.user.id,
    );
    return new ResponseDataDto({
      data: new OfferDetailsDto(updatedOffer.toJSON()),
      message: "Offer items added successfully",
      status: HttpStatus.OK,
    });
  }

  @Delete(":id/items")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomOkResponse(OfferDetailsDto)
  @ApiOperation({
    summary: "Delete offer items.",
    description:
      "Requires authorized user to have a `provider` or `support` role access. Customer support must be the creator of the offer",
  })
  async removeOfferItems(
    @Req() request: Request,
    @Param("id", MongoIdPipe) offerId: string,
    @Body(new ParseArrayPipe({ items: String }))
    itemIds: string[],
  ): Promise<ResponseDataDto<OfferDetailsDto>> {
    const updatedOffer = await this.offersService.removedItems(
      offerId,
      itemIds,
      request.user.id,
    );
    return new ResponseDataDto({
      data: new OfferDetailsDto(updatedOffer.toJSON()),
      message: "Offers items deleted successfully",
      status: HttpStatus.OK,
    });
  }
}
