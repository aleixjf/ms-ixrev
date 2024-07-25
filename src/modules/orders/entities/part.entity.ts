import {
    BaseEntity,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";

import {Order} from "./order.entity";
import {PartMapper} from "@modules/orders/entities/part.mapper";

@Entity({name: "parts"})
export class Part extends BaseEntity {
    @PrimaryColumn({
        type: "uuid",
        unique: false,
        primaryKeyConstraintName: "PK_PART",
    })
    @Index("IDX_PART", {})
    id: string;

    @Column()
    quantity: number;

    @Column({nullable: true})
    name?: string;

    @Column({nullable: true})
    description?: string;

    @Column({nullable: true})
    price?: string;

    @ManyToOne(() => Order, (order) => order.parts)
    @JoinColumn({name: "order_id", foreignKeyConstraintName: "FK_M2O_ORDER"})
    @Index("IDX_ORDER", {})
    order: Order;

    constructor(partial: Partial<Part>) {
        super();
        Object.assign(this, partial);
    }

    toDTO() {
        return new PartMapper().entityToDTO(this);
    }
}
