import {
    Controller,
    Get,
    Logger,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import {GrpcMethod} from "@nestjs/microservices";

import {AppService} from "@modules/app/app.service";

import {gRPCInterceptor} from "@interceptors/grpc.interceptor";
import {HTTPInterceptor} from "@interceptors/http.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller()
@UseInterceptors(HTTPInterceptor, gRPCInterceptor)
@UseFilters(
    InternalExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(private readonly appService: AppService) {}

    @Get()
    @GrpcMethod()
    // @GrpcMethod("AppController", "IsHealthy")
    // The controller name and the method name are unnecessary here since the main/parent controller and the method have the exact same names (transformed to PascalCase) as defined in the proto file
    isHealthy(): boolean {
        return this.appService.isHealthy();
    }
}
