import {OmitType} from "@nestjs/mapped-types";

import {OrderDTO} from "@modules/orders/dtos/order.dto";

export class CreateOrderRequestDTO extends OmitType(OrderDTO, [
    "id",
    "status",
] as const) {}
