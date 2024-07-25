import {PartDTO} from "@modules/orders/dtos/part.dto";
import {Part} from "@modules/orders/entities/part.entity";

export class PartMapper {
    dtoToEntity(dto: PartDTO): Part {
        return new Part({
            id: dto.id,
            quantity: dto.quantity,
            name: dto.name,
            description: dto.description,
            price: dto.price,
        });
    }

    getEntity(order: Part | PartDTO): Part {
        return order instanceof Part ? order : this.dtoToEntity(order);
    }

    entityToDTO(entity: Part): PartDTO {
        return new PartDTO({
            id: entity.id,
            quantity: entity.quantity,
            name: entity.name,
            description: entity.description,
            price: entity.price,
        });
    }

    getDTO(Part: Part | PartDTO): PartDTO {
        return Part instanceof PartDTO ? Part : this.entityToDTO(Part);
    }
}
