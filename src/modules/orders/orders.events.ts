import {Controller, Inject, Logger, ValidationPipe} from "@nestjs/common";
import {
    ClientKafka,
    Ctx,
    KafkaContext,
    MessagePattern,
    Payload,
} from "@nestjs/microservices";

import {catchError, from, map, Observable, switchMap} from "rxjs";

import {plainToClass} from "class-transformer";
import {validate} from "class-validator";
import {v4} from "uuid";

import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";

import {OrdersService} from "@modules/orders/orders.service";

@Controller("orders")
export class OrdersEvents {
    private readonly logger = new Logger(OrdersEvents.name);
    private readonly validationPipe = new ValidationPipe({transform: true});

    constructor(
        private ordersService: OrdersService,
        @Inject("ORDERS_SERVICE") private readonly client: ClientKafka
    ) {}

    @MessagePattern("orders.create")
    createOrder(
        @Payload() data: CreateOrderRequestDTO,
        @Ctx() context: KafkaContext
    ): Observable<unknown> {
        const topic = context.getTopic();
        this.logger.debug("Creating order", {data, topic});

        const transformed = plainToClass(CreateOrderRequestDTO, data);

        return from(validate(transformed)).pipe(
            map((errors) => {
                if (errors.length > 0) {
                    throw new Error(
                        `Validation failed:\n${errors
                            .map(
                                (error) =>
                                    `${error.property}: ${error.value || "undefined"}\n${Object.values(error.constraints)}\n`
                            )
                            .join("\n")}`
                    );
                }
                return transformed;
            }),
            switchMap((data) => {
                const order = new OrderDTO({
                    id: v4(),
                    ...data,
                });
                return this.ordersService.createOrder(order);
            }),
            map((order) => this.client.emit("orders.created", order.toPlain())),
            catchError((error) => {
                this.client.emit(`${topic}.dlq`, {data, error});
                return error;
            })
        );
    }

    @MessagePattern("orders.create.dlq")
    createOrderError(
        @Payload() data: {data: any; error: any},
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.warn(
            `Topic ${topic}: An error happenned during order creation`,
            data.data,
            data.error
        );
        // ? Notify about the unprocessed message
        return;
    }
}
