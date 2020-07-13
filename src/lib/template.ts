import { Environment, FileSystemLoader } from "nunjucks";
import pascalcase from "pascalcase";
import { join } from "path";
import { promises as fs, existsSync, mkdirSync } from "fs";
import { Product, Portfolio } from "./model";
import { major } from "semver";

const njs = new Environment(new FileSystemLoader(join(__dirname, "../..", "templates")));

export async function writeTemplates(portfolio: Portfolio, baseDir: string): Promise<void[]> {
    if (!existsSync(baseDir)) {
        mkdirSync(baseDir);
    }
    return await Promise.all(
        Object.entries(getTemplates(portfolio)).map(([filename, template]) =>
            fs.writeFile(join(baseDir, filename), template),
        ),
    );
}

export function getTemplates(portfolio: Portfolio): { [key: string]: string } {
    const index = {
        ["index.ts"]: renderPortfolio(portfolio),
    };
    const fileContents = portfolio.Products.map((p) => ({
        [`${pascalcase(p.Name)}.ts`]: renderProduct(p),
    }));
    return Object.assign(index, ...fileContents);
}

export const renderProduct = (product: Product): string => {
    return njs.render("product.ts.njk", { ...product, pascalcase, major });
};

export const renderPortfolio = (portfolio: Portfolio): string => {
    return njs.render("portfolio.ts.njk", { ...portfolio, pascalcase });
};
