import {NotFoundException} from "@nestjs/common";
import {ClientKafka} from "@nestjs/microservices";
import {Test, TestingModule} from "@nestjs/testing";

import {of} from "rxjs";

import {OrderStatus} from "@enums/order-status.enum";

import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {DeleteOrderRequestDTO} from "@modules/orders/dtos/delete-order.request.dto";
import {GetOrderRequestDTO} from "@modules/orders/dtos/get-order.request.dto";
import {GetOrdersRequestDTO} from "@modules/orders/dtos/get-orders.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {UpdateOrderStatusRequestDTO} from "@modules/orders/dtos/update-order-status.request.dto";

import {OrdersService} from "@modules/orders/orders.service";

import {OrdersController} from "./orders.controller";

// Mock classes
const mockOrdersService = {
    getOrder: jest.fn(),
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
};

const mockClientKafka = {
    emit: jest.fn(),
};

describe("OrdersController", () => {
    let controller: OrdersController;
    let ordersService: OrdersService;
    let clientKafka: ClientKafka;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersController],
            providers: [
                {provide: OrdersService, useValue: mockOrdersService},
                {provide: "ORDERS_SERVICE", useValue: mockClientKafka},
            ],
        }).compile();

        controller = module.get<OrdersController>(OrdersController);
        ordersService = module.get<OrdersService>(OrdersService);
        clientKafka = module.get<ClientKafka>("ORDERS_SERVICE");
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getOrder", () => {
        it("should return an order if found", (done) => {
            const id = "123";
            const order = new OrderDTO({id});
            mockOrdersService.getOrder.mockReturnValue(of(order));

            const data: GetOrderRequestDTO = {id};
            controller.getOrder(data, null, null).subscribe((response) => {
                expect(response).toEqual(order);
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            const orderId = "123";
            mockOrdersService.getOrder.mockReturnValue(of(null));

            const data: GetOrderRequestDTO = {id: orderId};
            controller.getOrder(data, null, null).subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(NotFoundException);
                    done();
                },
            });
        });
    });

    describe("getOrders", () => {
        it("should return an array of orders", (done) => {
            const orders = [new OrderDTO({id: "1"}), new OrderDTO({id: "2"})];
            mockOrdersService.getOrders.mockReturnValue(of(orders));

            const data: GetOrdersRequestDTO = {ids: ["123", "456"]};
            controller.getOrders(data, null, null).subscribe((response) => {
                expect(response).toEqual(orders);
                done();
            });
        });
    });

    describe("createOrder", () => {
        it("should create a new order and emit an event", (done) => {
            const order = new OrderDTO({id: "1"});
            mockOrdersService.createOrder.mockReturnValue(of(order));
            const data: CreateOrderRequestDTO = new CreateOrderRequestDTO(
                order
            );

            controller.createOrder(data, null, null).subscribe((response) => {
                expect(response).toEqual(order);
                expect(clientKafka.emit).toHaveBeenCalledWith(
                    "orders.created",
                    order
                );
                done();
            });
        });
    });

    describe("updateOrderStatus", () => {
        it("should update an order status", (done) => {
            const order = new OrderDTO({
                id: "1",
                status: OrderStatus.CONFIRMED,
            });
            mockOrdersService.updateOrder.mockReturnValue(of(order));
            const data: UpdateOrderStatusRequestDTO = {
                id: "1",
                status: OrderStatus.CONFIRMED,
            };

            controller
                .updateOrderStatus(data, null, null)
                .subscribe((response) => {
                    expect(response).toEqual(order);
                    done();
                });
        });
    });

    describe("deleteOrder", () => {
        it("should delete an order", (done) => {
            mockOrdersService.deleteOrder.mockReturnValue(of(true));
            const data: DeleteOrderRequestDTO = {id: "1"};

            controller.deleteOrder(data, null, null).subscribe((response) => {
                expect(response).toBe(true);
                done();
            });
        });
    });
});
