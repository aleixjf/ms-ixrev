import {
    Controller,
    Inject,
    Logger,
    NotFoundException,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import {ClientKafka, GrpcMethod} from "@nestjs/microservices";

import {map, Observable} from "rxjs";

import {Metadata, ServerUnaryCall} from "@grpc/grpc-js";
import {v4} from "uuid";

import {ValidateGrpc} from "@decorators/grpc-validation.decorator";

import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {DeleteOrderRequestDTO} from "@modules/orders/dtos/delete-order.request.dto";
import {GetOrderRequestDTO} from "@modules/orders/dtos/get-order.request.dto";
import {GetOrdersRequestDTO} from "@modules/orders/dtos/get-orders.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {UpdateOrderStatusRequestDTO} from "@modules/orders/dtos/update-order-status.request.dto";
import {UpdateOrderRequestDTO} from "@modules/orders/dtos/update-order.request.dto";

import {OrdersService} from "@modules/orders/orders.service";

import {gRPCInterceptor} from "@interceptors/grpc.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

// import { configureRequest } from '@orders/request';

@Controller("orders")
@UseInterceptors(gRPCInterceptor)
@UseFilters(
    InternalExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);
    constructor(
        private ordersService: OrdersService,
        @Inject("ORDERS_SERVICE") private readonly client: ClientKafka
    ) {}

    @GrpcMethod()
    @ValidateGrpc(GetOrderRequestDTO)
    getOrder(
        data: GetOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        const id = data.id;
        return this.ordersService.getOrder(id).pipe(
            map((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                return order;
            })
        );
    }

    @GrpcMethod()
    getOrders(
        data: GetOrdersRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO[]> {
        const ids = data.ids;
        return this.ordersService.getOrders(ids);
    }

    @GrpcMethod()
    @ValidateGrpc(CreateOrderRequestDTO)
    createOrder(
        data: CreateOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        const order = new OrderDTO({
            id: v4(),
            ...data,
        });
        return this.ordersService.createOrder(order);
    }

    // @GrpcMethod()
    // @ValidateGrpc(UpdateOrderRequestDTO)
    // updateOrder(
    //     data: UpdateOrderRequestDTO,
    //     metadata: Metadata,
    //     call: ServerUnaryCall<any, any>
    // ): Observable<OrderDTO> {
    //     return this.ordersService.updateOrder(data.id, data);
    // }

    @GrpcMethod()
    @ValidateGrpc(UpdateOrderRequestDTO)
    updateOrderStatus(
        data: UpdateOrderStatusRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(data.id, data);
    }

    @GrpcMethod()
    @ValidateGrpc(DeleteOrderRequestDTO)
    deleteOrder(
        data: DeleteOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<boolean> {
        const id = data.id;
        return this.ordersService.deleteOrder(id);
    }
}
