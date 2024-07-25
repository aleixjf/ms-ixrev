import {IsUUID} from "class-validator";

export class GetOrdersRequestDTO {
    @IsUUID(undefined, {each: true})
    ids: string[];
}
