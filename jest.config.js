module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "(/tests.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testRegex: '/tests/.*\\.(test|spec|integration)?\\.(ts|tsx)$',
    testPathIgnorePatterns: ["/lib/", "/node_modules/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    coverageDirectory: "./.cover",
    collectCoverageFrom: ["**/src/**/*.{ts}"], //"!src/**/index.{ts}"],
    coverageThreshold: {
        "global": {
            "branches": 80,
            "functions": 80,
            "lines": 80,
            "statements": 80
        }
    }
};