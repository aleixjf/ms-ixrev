import {HttpStatus} from "@nestjs/common";

export interface CustomRpcError {
    code: number;
    message: string;
}

export const customRpcError = ({
    code = HttpStatus.INTERNAL_SERVER_ERROR,
    status = HttpStatus[code],
    message = "An unexpected error occurred",
    cause,
}: {
    code?: number;
    status?: string;
    message?: string;
    cause?: string;
}): CustomRpcError => ({
    code,
    message:
        message && cause
            ? `Message: ${message};\nCause: ${cause}`
            : message || cause || "An unexpected error occurred",
});
