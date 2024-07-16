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
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiCustomCreatedResponse,
  ApiCustomOkResponse,
} from "src/helpers/api-decorator";
import { ResponseDataDto, ResponseMetadataDto } from "src/helpers/api-dto";
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
  async finOne(
    @Param("id") offerId: string,
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
  async updateOffer(
    @Req() request: Request,
    @Param("id") offerId: string,
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
      status: HttpStatus.CREATED,
    });
  }

  @Delete(":id")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiNoContentResponse({
    type: ResponseMetadataDto,
  })
  async deleteOffer(
    @Req() request: Request,
    @Param("id") offerId: string,
  ): Promise<ResponseMetadataDto> {
    await this.offersService.delete(offerId, request.user.id);
    return new ResponseMetadataDto({
      message: "Offer deleted successfully",
      status: HttpStatus.CREATED,
    });
  }

  @Put(":id/items")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomOkResponse(OfferDetailsDto)
  async addedOfferItems(
    @Req() request: Request,
    @Param("id") offerId: string,
    @Body(new ParseArrayPipe({ items: CreateOfferItemDto }))
    payload: CreateOfferItemDto[],
  ): Promise<ResponseDataDto<OfferDetailsDto>> {
    const updatedOffer = await this.offersService.addItems(
      offerId,
      payload,
      request.user.id,
    );
    return new ResponseDataDto({
      data: new OfferDetailsDto(updatedOffer.toJSON()),
      message: "Offer items created successfully",
      status: HttpStatus.CREATED,
    });
  }

  @Delete(":id/items")
  @UseRoles(Role.SUPPORT, Role.PROVIDER)
  @ApiCustomOkResponse(OfferDetailsDto)
  async removeOfferItems(
    @Req() request: Request,
    @Param("id") offerId: string,
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
      status: HttpStatus.CREATED,
    });
  }
}
