import {Injectable, Logger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {InjectRepository} from "@nestjs/typeorm";

import {from, map, Observable, switchMap} from "rxjs";

import {In, Repository} from "typeorm";

import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {Order} from "@modules/orders/entities/order.entity";
import {Part} from "@modules/orders/entities/part.entity";

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);
    constructor(
        private readonly configurationService: ConfigService,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(Part)
        private partsRepository: Repository<Part>
    ) {}

    getOrder(id: string): Observable<OrderDTO | null> {
        return from(
            this.ordersRepository.findOne({
                where: {id},
            })
        ).pipe(
            map((entity) => {
                if (!entity) return null;
                return entity.toDTO();
            })
        );
    }

    getOrders(ids?: string[]): Observable<OrderDTO[]> {
        return from(
            this.ordersRepository.find({
                where: ids ? [{id: In(ids)}] : undefined,
            })
        ).pipe(map((entities) => entities.map((entity) => entity.toDTO())));
    }

    createOrder(order: OrderDTO): Observable<OrderDTO> {
        return from(this.ordersRepository.save(order.toEntity())).pipe(
            map((entity) => entity.toDTO())
        );
    }

    updateOrder(id: string, data: Partial<OrderDTO>): Observable<OrderDTO> {
        const partialDTO = new OrderDTO({id, ...data});
        const partialEntity: Partial<Order> = partialDTO.toEntity();
        Object.keys(partialEntity).forEach((key) => {
            if (partialEntity[key] === undefined) delete partialEntity[key];
        });

        return from(this.ordersRepository.save(partialEntity)).pipe(
            switchMap((entity) => this.getOrder(entity.id))
        );
    }

    deleteOrder(id: string): Observable<boolean> {
        return from(this.ordersRepository.delete(id)).pipe(
            map((result) => result.affected > 0)
        );
        return;
    }
}
