import {pathsToModuleNameMapper} from "ts-jest";

import {compilerOptions} from "../tsconfig.json";

export default {
    globals: {
        NODE_ENV: "test",
    },
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    coverageDirectory: "./coverage",
    testEnvironment: "node",
    testRegex: ".e2e-spec.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: [],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: "<rootDir>/../",
    }),
};
