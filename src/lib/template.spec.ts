import { renderPortfolio, renderProduct } from "./template";
import { Portfolio } from "./model";
import chai from "chai";
import chaiJestSnapshot from "chai-jest-snapshot";
chai.use(chaiJestSnapshot);

const portfolio: Portfolio = {
    Products: [
        {
            Name: "cloud-pipeline",
            ProvisioningArtifacts: [
                {
                    Name: "v1",
                    Parameters: [
                        {
                            ParameterName: "input_one",
                            ParameterType: "String",
                            ParameterRequired: true,
                        },
                        {
                            ParameterName: "input_two",
                            ParameterType: "String",
                            ParameterRequired: false,
                        },
                    ],
                    Outputs: [
                        {
                            OutputName: "output_one",
                        },
                    ],
                },
            ],
        },
        {
            Name: "cloud-website",
            ProvisioningArtifacts: [
                {
                    Name: "v1",
                    Parameters: [
                        {
                            ParameterName: "input_one",
                            ParameterType: "String",
                            ParameterRequired: false,
                        },
                    ],
                    Outputs: [
                        {
                            OutputName: "output_one",
                        },
                        {
                            OutputName: "output_two",
                        },
                    ],
                },
            ],
        },
    ],
};

describe("Given a portfolio definition", function () {
    before(function () {
        chaiJestSnapshot.resetSnapshotRegistry();
    });

    beforeEach(function () {
        chaiJestSnapshot.configureUsingMochaContext(this);
    });

    describe("When I render the template", function () {
        const template = renderPortfolio(portfolio);

        // it("Then the rendered file should be valid typescript", function () {});

        it("Then the rendered file should match the snapshot", function () {
            chai.expect(template).to.matchSnapshot();
        });
    });
});

describe("Given a product definition", function () {
    describe("When I render the template", function () {
        const template = renderProduct(portfolio.Products[0]);

        // it("Then the rendered file should be valid typescript", function () {});

        it("Then the rendered file should match the snapshot", function () {
            chai.expect(template).to.matchSnapshot();
        });
    });
});
