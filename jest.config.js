export default {
	verbose: true,
	roots: ["<rootDir>/src", "<rootDir>/__tests__"],
	testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
	testEnvironment: "node",
	globals: {
		preset: "ts-jest/presets/js-with-babel",
	},
};