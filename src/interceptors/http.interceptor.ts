import {
    CallHandler,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NestInterceptor,
} from "@nestjs/common";

import {Observable, throwError} from "rxjs";
import {delay, map, mergeMap, retryWhen, tap} from "rxjs/operators";

import {Request} from "express";

import {Context} from "@enums/context.enum";

@Injectable()
export class HTTPInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HTTPInterceptor.name);
    // constructor(private readonly authService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== Context.HTTP) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<Request>();
        this.logger.debug("Intercepted HTTP request", {
            method: `${request.method} ${request.url}`,
            handler: `${context.getClass().name}.${context.getHandler().name}`,
            data: context.switchToHttp().getRequest().body,
            origin:
                // Retrieve the IP address from the client/request
                request.socket.remoteAddress ||
                request.headers["x-forwarded-for"][0] ||
                request.connection.remoteAddress ||
                request.headers["x-real-ip"][0] ||
                request.headers["x-cluster-client-ip"][0] ||
                request.headers["x-forwarded"][0] ||
                request.headers["forwarded-for"][0] ||
                request.headers.forwarded ||
                request.ip ||
                request.ips[0] ||
                undefined,
            /*
            details: {
                url: `${request.protocol}://${
                    request.headers.host || request.hostname
                }${request.url}`,
                headers: request.headers,
            },
            */
        });

        /*
        // ? This allows us to make regular HTTP requests, without to modifying their body to { data: { body }}, and use the same methods for both HTTP and gRPC requests.
        // ! Not needed anymore, we can add the @Body decorator to the data parameter in the controller methods.
        request.body = {
            data: request.body,
        };
        console.debug("Body", request.body);
        */

        return next.handle().pipe(
            tap((data) => {
                this.logger.debug("Intercepted HTTP response");
            }),
            // ? Transform data to JSON format
            map((data) => {
                return {
                    success: true,
                    data,
                };
            }),
            // ? Transform different errors to HTTP errors
            /*
            catchError((error) => {
                // ! If we handle errors here, and transform them to HttpExceptions, they won't go through the different exception filters (except the RpcException filter), since they are already handled here.
                const type = error.constructor.name || error.name || undefined;
                console.debug(`Intercepted ${type} error in HTTP context`);

                switch (true) {
                    case error instanceof AxiosError:
                    case error instanceof HttpException:
                    case error instanceof RpcException:
                    case error instanceof Error:
                    default:
                        console.debug("Unknown error intercepted");
                        return throwError(
                            () =>
                                new HttpException(
                                    typeof error === "string"
                                        ? error
                                        : typeof error === "object"
                                        ? error.message
                                            ? error.message
                                            : JSON.stringify(error)
                                        : "Internal error",
                                    HttpStatus.INTERNAL_SERVER_ERROR
                                )
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
                            case error.status === 401 || error.status === 403:
                            case error.response?.status === 401 ||
                                error.response?.status === 403:
                                if (retryCount === 0) {
                                    return this.authService
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
                            case error.status === 429:
                            case error.response?.status === 429:
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
                                                new HttpException(
                                                    "Rate limit exceeded",
                                                    HttpStatus.TOO_MANY_REQUESTS
                                                )
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
