import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from "@nestjs/common";
import {RpcException} from "@nestjs/microservices";

import {Observable, throwError} from "rxjs";
import {delay, map, mergeMap, retryWhen, tap} from "rxjs/operators";

import * as grpc from "@grpc/grpc-js";
import {Metadata} from "@grpc/grpc-js";
import {deadlineToString} from "@grpc/grpc-js/build/src/deadline";

import {Context} from "@enums/context.enum";

import {gRPCCall, isgRPCCall} from "./interfaces/grpc.call.interface";

@Injectable()
export class gRPCInterceptor implements NestInterceptor {
    private readonly logger = new Logger(gRPCInterceptor.name);
    // constructor(private readonly authService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== Context.RPC) return next.handle();

        const isgRPC: boolean =
            context.getArgs().length === 3 &&
            context.getArgByIndex(0) instanceof Object &&
            context.getArgByIndex(1) instanceof Metadata &&
            isgRPCCall(context.getArgByIndex(2));
        if (!isgRPC) {
            console.debug(
                "An RPC call has been intercepted, but isn't a gRPC call. Skipping interceptor.",
                context.getArgs()
            );
            return next.handle();
        }

        const [data, metadata, call] = context.getArgs() as [
            object,
            Metadata,
            gRPCCall,
        ];
        this.logger.debug("Intercepted gRPC call", {
            method: call.getPath().substring(1),
            handler: `${context.getClass().name}.${context.getHandler().name}`,
            data: context.switchToRpc().getData(),
            origin: call.getPeer(),
            deadline:
                call.getDeadline() && call.getDeadline() !== Infinity
                    ? deadlineToString(call.getDeadline())
                    : undefined, // call.getDeadline() ? new Date(call.getDeadline()) : undefined,
        });

        return next.handle().pipe(
            tap((response) => {
                this.logger.debug("Intercepted gRPC response");
            }),
            // ? Transform response to gRPC response
            map((response) => {
                if (response === null) return;
                switch (typeof response) {
                    case "object":
                        if (response instanceof Buffer)
                            return {
                                content: response,
                            };
                        else return response;

                    case "undefined":
                        return;
                    default:
                        return {
                            response,
                        };
                }
            }),
            // ? Transform different errors to RPC errors
            /*
            catchError((error) => {
                // ! If we handle errors here, and transform them to RpcExceptions, they won't go through the different exception filters (except the RpcException filter), since they are already handled here.
                const type = error.constructor.name || error.name || undefined;
                console.debug(`Intercepted ${type} error in RPC context`);
                switch (true) {
                    case error instanceof RpcException:
                    case error instanceof AxiosError:
                    case error instanceof HttpException:
                    case error instanceof Error:
                    default:
                        return throwError(
                            () =>
                                new RpcException({
                                    code: grpc.status.INTERNAL,
                                    message:
                                        typeof error === "string"
                                            ? error
                                            : typeof error === "object"
                                            ? error.message
                                                ? error.message
                                                : JSON.stringify(error)
                                            : "Internal error",
                                })
                        );
                }
            }),
            */
            // ? Retry on certain errors
            retryWhen((errors) =>
                errors.pipe(
                    mergeMap((error, retryCount) => {
                        switch (true) {
                            // Handle authentication errors
                            /*
                            case error.status === 16:
                                if (retryCount === 0) {
                                    return this.ordersService
                                        .authenticate()
                                        .pipe(
                                            catchError((authError) => {
                                                throw authError;
                                            }),
                                            take(1)
                                        );
                                }
                                break;
                            */

                            // Handle rate limitting errors
                            case error.status === 8:
                                if (retryCount === 0) {
                                    const retryAfter =
                                        Number(
                                            error.response?.headers[
                                                "retry-after"
                                            ]
                                        ) || 0;
                                    if (retryAfter > 0) {
                                        this.logger.log(
                                            `Rate limit exceeded. Retrying after ${retryAfter} seconds.`
                                        );
                                        return throwError(
                                            () =>
                                                new RpcException({
                                                    code: grpc.status
                                                        .RESOURCE_EXHAUSTED,
                                                    message:
                                                        "Rate limit exceeded",
                                                })
                                        ).pipe(delay(retryAfter * 1000));
                                    }
                                }
                                break;

                            default:
                                throw error;
                        }
                    })
                )
            )
        );
    }
}
