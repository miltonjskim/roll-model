// jest.config.ts
import nextJest from "next/jest";

const createJestConfig = nextJest({
    dir: "./",
});

const config = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    testEnvironment: "jest-environment-jsdom",
    moduleNameMapper: {
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^@/entities/(.*)$": "<rootDir>/src/entities/$1",
        "^@/features/(.*)$": "<rootDir>/src/features/$1",
        "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
        "^@/shared/(.*)$": "<rootDir>/src/shared/$1",
        "^@/widgets/(.*)$": "<rootDir>/src/widgets/$1",
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};

export default createJestConfig(config);