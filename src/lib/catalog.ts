import ServiceCatalog from "aws-sdk/clients/servicecatalog";
import S3 from "aws-sdk/clients/s3";
import ok from "assert";
import YAML from "js-yaml";
import { Product, Template, ProvisioningArtifactParameter, ProvisioningArtifact } from "./model";

export async function all<T>(generator: AsyncGenerator<T, void, unknown>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of generator) {
        items.push(item);
    }
    return items;
}

export class Catalog {
    constructor(private catalog: ServiceCatalog, private s3: S3) {}

    async *listProducts(PortfolioId?: string): AsyncGenerator<Product, void, unknown> {
        let PageToken;
        do {
            const { NextPageToken, ProductViewDetails } = await this.catalog
                .searchProductsAsAdmin({ PortfolioId })
                .promise();
            ok(ProductViewDetails);
            for (const { ProductViewSummary } of ProductViewDetails) {
                ok(ProductViewSummary?.Name);
                ok(ProductViewSummary?.ProductId);
                const { Name, ProductId } = ProductViewSummary;
                const ProvisioningArtifacts = await all(this.listProvisioningArtifacts(ProductId));
                yield { Name, ProvisioningArtifacts };
            }
            PageToken = NextPageToken;
        } while (PageToken);
    }

    async *getProducts(ProductIds: string[]): AsyncGenerator<Product, void, unknown> {
        for (const Id of ProductIds) {
            const { ProductViewSummary } = await this.catalog.describeProduct({ Id }).promise();
            ok(ProductViewSummary?.Name);
            ok(ProductViewSummary?.ProductId);
            const { Name, ProductId } = ProductViewSummary;
            const ProvisioningArtifacts = await all(this.listProvisioningArtifacts(ProductId));
            ok(ProvisioningArtifacts);
            yield { Name: Name, ProvisioningArtifacts };
        }
    }

    private async *listProvisioningArtifacts(ProductId: string): AsyncGenerator<ProvisioningArtifact, void, unknown> {
        const { ProvisioningArtifacts } = await this.catalog.describeProduct({ Id: ProductId }).promise();
        ok(ProvisioningArtifacts);
        for (const { Id: ProvisioningArtifactId, Name } of ProvisioningArtifacts) {
            ok(Name);
            ok(ProvisioningArtifactId);
            const { Info } = await this.catalog
                .describeProvisioningArtifact({ ProductId, ProvisioningArtifactId })
                .promise();
            ok(Info?.TemplateUrl);
            const { Parameters, Outputs } = await this.loadTemplateFromURL(Info.TemplateUrl);
            yield { Name, Parameters, Outputs };
        }
    }

    private async loadTemplateFromURL(url: string) {
        const re = /^https:\/\/(?<Bucket>.+)\.s3([\.-]?(?<Region>.+))?\.amazonaws\.com\/(?<Key>.+(json|yaml|yml))$/;
        const match = re.exec(url);
        const groups = match?.groups;
        ok(groups?.Bucket);
        ok(groups?.Key);
        const { Bucket, Key } = groups;
        this.s3.config.region = groups?.Region ?? this.s3.config.region;
        const { Body } = await this.s3.getObject({ Bucket, Key }).promise();
        ok(Body);
        const templateObject: Partial<Template> = Key.endsWith("json")
            ? JSON.parse(Body.toString())
            : YAML.safeLoad(Body.toString());
        return {
            Parameters: this.getParameters(templateObject),
            Outputs: this.getOutputs(templateObject),
        };
    }

    private getParameters(template: Partial<Template>): ProvisioningArtifactParameter[] {
        if (!template?.Parameters) {
            return [];
        }
        return Object.entries(template.Parameters).map(([ParameterName, Parameter]) => ({
            ParameterName,
            ParameterType: Parameter.Type,
            ParameterRequired: Parameter.Default === undefined,
            ParameterDescription: Parameter.Description,
        }));
    }

    private getOutputs(template: Partial<Template>): { OutputName: string }[] {
        if (!template?.Outputs) {
            return [];
        }
        return Object.entries(template.Outputs).map(([OutputName, Output]) => ({
            OutputName,
            OutputDescription: Output.Description,
        }));
    }
}
