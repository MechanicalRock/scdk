import { CommandModule } from "yargs";
import ServiceCatalog from "aws-sdk/clients/servicecatalog";
import S3 from "aws-sdk/clients/s3";

import { Catalog, all } from "../lib/catalog";
import { writeTemplates } from "../lib/template";

interface Args {
    portfolioId?: string;
    productId?: string[];
    dir: string;
}

module.exports = {
    command: "generate",
    desc: "Generates CDK constructs from AWS Service Catalog products",
    builder: {
        dir: {
            alias: "o",
            describe: "Output directory",
            demand: false,
            default: "./out",
        },
        "portfolio-id": {
            alias: "f",
            describe: "Generate constructs for all products in the specified portfolio",
            demand: false,
            conflicts: "product-id",
        },
        "product-id": {
            alias: "p",
            describe: "Generate a construct for the product with the specified product",
            demand: false,
            conflicts: "portfolio-id",
            type: "array",
            default: [],
        },
    },
    handler: async (argv) => {
        const { portfolioId, productId: productIds, dir } = argv;
        const serviceCatalog = new ServiceCatalog();
        const s3 = new S3();
        const catalog = new Catalog(serviceCatalog, s3);
        const Products = await all(productIds ? catalog.getProducts(productIds) : catalog.listProducts(portfolioId));
        await writeTemplates({ Products }, dir);
    },
} as CommandModule<unknown, Args>;
