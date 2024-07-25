import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {Order} from "@modules/orders/entities/order.entity";

export class OrderMapper {
    dtoToEntity(dto: OrderDTO): Order {
        return new Order({
            id: dto.id,
            supplier_id: dto.supplierId,
            delivery_date: dto.deliveryDate,
            order_date: dto.orderDate,
            status: dto.status,
            parts: dto.parts?.map((part) => part.toEntity()),
        });
    }

    getEntity(order: Order | OrderDTO): Order {
        return order instanceof Order ? order : this.dtoToEntity(order);
    }

    entityToDTO(entity: Order): OrderDTO {
        return new OrderDTO({
            id: entity.id,
            supplierId: entity.supplier_id,
            deliveryDate: entity.delivery_date,
            orderDate: entity.order_date,
            status: entity.status,
            parts: entity.parts?.map((part) => part.toDTO()),
        });
    }

    getDTO(Order: Order | OrderDTO): OrderDTO {
        return Order instanceof OrderDTO ? Order : this.entityToDTO(Order);
    }
}
