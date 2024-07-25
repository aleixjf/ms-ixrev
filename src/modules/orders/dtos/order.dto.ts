import {instanceToPlain, Type} from "class-transformer";
import {
    ArrayNotEmpty,
    IsEnum,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from "class-validator";

import {OrderStatus} from "@enums/order-status.enum";

import {PartDTO} from "./part.dto";
import {OrderMapper} from "@modules/orders/entities/order.mapper";

import {IsUnixDate} from "@validators/unix-date.validator";

export class OrderDTO {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsString()
    @IsNotEmpty()
    supplierId: string;

    @IsUnixDate()
    orderDate: number;

    @IsUnixDate()
    deliveryDate: number;

    @ValidateNested({each: true})
    @Type(() => PartDTO)
    @ArrayNotEmpty()
    parts: PartDTO[];

    constructor(partial: Partial<OrderDTO>) {
        Object.assign(this, partial);
    }

    toEntity() {
        return new OrderMapper().dtoToEntity(this);
    }

    toPlain() {
        return instanceToPlain(this);
    }
}
