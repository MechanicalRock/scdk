const base = require("@istanbuljs/nyc-config-babel");

module.exports = {
    ...base,
    require: ["./babel.register.js"],
    all: true,
    include: ["src/**/*.ts"],
    exclude: ["src/**/*.spec.ts", "src/**/__test__/*.ts"],
    "report-dir": ".coverage",
    reporter: ["text", "html"],
};
