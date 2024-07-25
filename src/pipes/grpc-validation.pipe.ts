import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from "@nestjs/common";

import {plainToClass} from "class-transformer";
import {validate} from "class-validator";

@Injectable()
export class GrpcValidationPipe implements PipeTransform {
    async transform(value: any, {metatype}: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            throw new BadRequestException("Validation failed", {
                cause: errors
                    .map(
                        (error) =>
                            `${error.property}: ${error.value || "undefined"}\n${Object.values(error.constraints)}\n`
                    )
                    .join("\n"),
            });
        }
        return object;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}
