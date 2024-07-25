import {
    BaseEntity,
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";

import {OrderStatus} from "@enums/order-status.enum";

import {Part} from "./part.entity";
import {OrderMapper} from "@modules/orders/entities/order.mapper";

@Entity({name: "orders"})
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn("uuid", {
        primaryKeyConstraintName: "PK_ORDER",
    })
    id: string;

    @Column({type: "uuid"})
    @Index("IDX_SUPPLIER", {})
    supplier_id: string;

    @Column("bigint")
    order_date: number;

    @Column()
    delivery_date: number;

    @OneToMany(() => Part, (part) => part.order, {
        cascade: true,
        eager: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    })
    parts: Part[];

    @Column({type: "enum", enum: OrderStatus, default: OrderStatus.PENDING})
    @Index("IDX_STATUS", {})
    status: OrderStatus;

    constructor(partial: Partial<Order>) {
        super();
        Object.assign(this, partial);
    }

    toDTO() {
        return new OrderMapper().entityToDTO(this);
    }
}
