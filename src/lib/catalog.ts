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
                ok(ProductViewSummary?.Id);
                const { Name, Id } = ProductViewSummary;
                const ProvisioningArtifacts = await all(this.listProvisioningArtifacts(Id));
                yield { Name, ProvisioningArtifacts };
            }
            PageToken = NextPageToken;
        } while (PageToken);
    }

    async *getProducts(ProductIds: string[]): AsyncGenerator<Product, void, unknown> {
        for (const Id of ProductIds) {
            const { ProductViewSummary } = await this.catalog.describeProduct({ Id }).promise();
            ok(ProductViewSummary?.Name);
            const ProvisioningArtifacts = await all(this.listProvisioningArtifacts(Id));
            ok(ProvisioningArtifacts);
            yield { Name: ProductViewSummary.Name, ProvisioningArtifacts };
        }
    }

    private async *listProvisioningArtifacts(ProductId: string): AsyncGenerator<ProvisioningArtifact, void, unknown> {
        let PageToken;
        do {
            const { NextPageToken, ProvisioningArtifactDetails } = await this.catalog
                .listProvisioningArtifacts({ ProductId })
                .promise();
            ok(ProvisioningArtifactDetails);
            for (const { Id: ProvisioningArtifactId, Name } of ProvisioningArtifactDetails) {
                ok(Name);
                ok(ProvisioningArtifactDetails);
                const { Info } = await this.catalog
                    .describeProvisioningArtifact({ ProductId, ProvisioningArtifactId })
                    .promise();
                ok(Info);
                const { Parameters, Outputs } = await this.loadTemplateFromURL(Info.LoadTemplateFromURL);
                yield { Name, Parameters, Outputs };
            }
            PageToken = NextPageToken;
        } while (PageToken);
    }

    private async loadTemplateFromURL(url: string) {
        const re = /^https:\/\/(?<Bucket>.+)\.s3[\.-](?<Region>.+)\.amazonaws\.com\/(?<Key>.+(json|yaml|yml))$/;
        const match = re.exec(url);
        const groups = match?.groups;
        ok(groups?.Bucket);
        ok(groups?.Region);
        ok(groups?.Key);
        const { Bucket, Key, Region } = groups;
        this.s3.config.region = Region;
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
        }));
    }

    private getOutputs(template: Partial<Template>): { OutputName: string }[] {
        if (!template?.Outputs) {
            return [];
        }
        return Object.entries(template.Outputs).map(([OutputName]) => ({
            OutputName,
        }));
    }
}
