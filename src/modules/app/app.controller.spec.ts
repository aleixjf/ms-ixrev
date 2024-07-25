import {Test, TestingModule} from "@nestjs/testing";

import {AppService} from "@modules/app/app.service";

import {AppController} from "@modules/app/app.controller";

// Mocking the AppService
const mockAppService = {
    isHealthy: jest.fn(),
};

describe("AppController", () => {
    let appController: AppController;
    let appService: AppService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [{provide: AppService, useValue: mockAppService}],
        }).compile();

        appController = module.get<AppController>(AppController);
        appService = module.get<AppService>(AppService);
    });

    it("should be defined", () => {
        expect(appController).toBeDefined();
    });

    describe("isHealthy", () => {
        it("should return true when AppService isHealthy is called", () => {
            // Arrange
            const expectedResult = true;
            jest.spyOn(appService, "isHealthy").mockImplementation(
                () => expectedResult
            );

            // Act
            const result = appController.isHealthy();

            // Assert
            expect(result).toBe(expectedResult);
            expect(appService.isHealthy).toHaveBeenCalled();
        });
    });
});
