import type { InitialOptionsTsJest } from "ts-jest/dist/types";
import { jsWithTs as tsjPreset } from "ts-jest/presets";

const config: InitialOptionsTsJest = {
	verbose: true,
	roots: ["<rootDir>/src", "<rootDir>/__tests__"],
	testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
	transform: {
		...tsjPreset.transform,
	},
	collectCoverage: true,
	coverageDirectory: ".coverage",
	coverageReporters: ["text"],
};

console.log(config);

export default config;
