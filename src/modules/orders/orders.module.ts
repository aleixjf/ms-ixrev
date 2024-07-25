import {Module} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {ClientProxyFactory, Transport} from "@nestjs/microservices";
import {TypeOrmModule} from "@nestjs/typeorm";

import {Order} from "@modules/orders/entities/order.entity";
import {Part} from "@modules/orders/entities/part.entity";

import {OrdersService} from "@modules/orders/orders.service";

import {OrdersController} from "@modules/orders/orders.controller";

import {OrdersEvents} from "@modules/orders/orders.events";

@Module({
    controllers: [OrdersController, OrdersEvents],
    imports: [
        TypeOrmModule.forFeature([Order, Part]),
        /*
        .registerAsync({
            useFactory: () => ({
                timeout: 5000,
                maxRedirects: 5,
            }),
        }),
        */
    ],
    providers: [
        {
            // KafkaJS Client
            provide: "ORDERS_SERVICE",
            useFactory: (configService: ConfigService) =>
                ClientProxyFactory.create({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            brokers: [
                                configService.get<string>("kafka.broker"),
                            ],
                        },
                    },
                }),
            inject: [ConfigService],
        },
        OrdersService,
        /*
        {
            provide: APP_INTERCEPTOR,
            useClass: OrdersHTTPInterceptor,
        },
        */
    ],
})
export class OrdersModule {}
