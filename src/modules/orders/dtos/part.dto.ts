import {IsInt, IsOptional, IsString, IsUUID} from "class-validator";

import {PartMapper} from "@modules/orders/entities/part.mapper";

export class PartDTO {
    @IsUUID()
    id: string;

    @IsInt()
    quantity: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    price?: string;

    constructor(partial: Partial<PartDTO>) {
        Object.assign(this, partial);
    }

    toEntity() {
        return new PartMapper().dtoToEntity(this);
    }
}

export class PartDTO2 {
    @IsUUID()
    id: string;

    @IsInt()
    quantity: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    price?: string;
}
