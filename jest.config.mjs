export default {
  clearMocks: true,
  collectCoverage: true,
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
