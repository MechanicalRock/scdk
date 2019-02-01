import { Argv, Arguments } from 'yargs'
import { ServiceCatalog } from 'aws-sdk'
import { ProductAst } from '../lib/Generate'
import compareVersions from 'compare-versions';
import { pascalCase } from 'change-case'

import { CdkProductRenderer } from '../lib/generate';
import { join } from 'path';
import * as nunjucks from 'nunjucks';

type Args = {
    portfolio: Promise<string>
    response: any
}

module.exports = {
    command: 'generate',
    describe: 'generate CDK constructs for the target catalog',
    builder: (yargs: Argv) => {
        return yargs.demandOption('portfolio')
            .coerce('portfolio', async (arg: string) => {
                if (arg.startsWith('port-')) {
                    return arg
                }
                const catalog = new ServiceCatalog()
                let nextPage = () => ListPortfolios(catalog)
                do {
                    const { PortfolioDetails, nextPage: next }  = await nextPage()
                    nextPage = next

                    const portfolio = PortfolioDetails.find(pd => pd.DisplayName === arg)
                    if (portfolio) {
                        return portfolio.Id
                    }
                } while (nextPage)
                throw new Error('Could not find specified portfolio')
            })
    },
    handler: async (args: Arguments<Args>) => {
        const portfolio = await args.portfolio
        const catalog = new ServiceCatalog()
        const asts: ProductAst[] = []
        let nextPage = () => SearchProducts(catalog, portfolio)

        do {
            const { ProductViewDetails: pvds, nextPage: next } = await nextPage()

            const productDetails = (await Promise.all(pvds.map(async p => {
                const {ProductViewDetail, ProvisioningArtifactSummaries} = 
                    await ListProductDetails(catalog, p.ProductViewSummary.ProductId)
                
                return ProvisioningArtifactSummaries.map(ProvisioningArtifactSummary => ({
                    ProvisioningArtifactSummary,
                    ProductViewDetail
                }))
                .sort((a, b) => versionSort(b.ProvisioningArtifactSummary.Name, a.ProvisioningArtifactSummary.Name))
                .slice(0, 1)
            }))).reduce((acc, n) => acc.concat(n))

            const data = await Promise.all(productDetails.map(async p => {
                const ProvisioningParameters = await GetProvisioningParameters(
                    catalog, p.ProductViewDetail.ProductViewSummary.ProductId, p.ProvisioningArtifactSummary.Id)

                return {
                    ...p,
                    ProvisioningParameters
                }
            }))
            
            asts.push(...data.map(d => convertToAst(d)))
            nextPage = next
        } while (nextPage)

        const templateDir = join(__dirname, '../../templates')
        const renderer = nunjucks.configure(templateDir, {})
        const cdkProductRenderer = new CdkProductRenderer(renderer)
        const source = cdkProductRenderer.generate('cdk-product.ts.njk', { products: asts })
        args.response(source)
    }
}

interface AwsModel {
    ProvisioningParameters: ServiceCatalog.ProvisioningArtifactParameter[];
    ProductViewDetail: ServiceCatalog.ProductViewDetail;
    ProvisioningArtifactSummary: ServiceCatalog.ProvisioningArtifactSummary;
}

export function convertToAst(model: AwsModel): ProductAst {
    return {
        name: pascalCase(model.ProductViewDetail.ProductViewSummary.Name),
        productId: model.ProductViewDetail.ProductViewSummary.ProductId,
        version: model.ProvisioningArtifactSummary.Name,
        parameters: model.ProvisioningParameters.map(p => ({ name: p.ParameterKey, default: p.DefaultValue})),
    }
}

function versionSort(va: string, vb: string) {
    const a: string = (va.match(/v[\d\.?]+/) as any)[0];
    const b: string = (vb.match(/v[\d\.?]+/) as any)[0];
    return compareVersions(a, b);
}

export async function SearchProducts(catalog: ServiceCatalog, portfolioId: string) {
    // const filter = !product ? null : {
    //     'FullTextSearch': [product]
    // }

    const searchProducts = async (page?: string) => {
        const { ProductViewDetails, NextPageToken} = await catalog.searchProductsAsAdmin({ PortfolioId: portfolioId, PageToken: page}).promise()
        const nextPage = NextPageToken ? () => searchProducts(NextPageToken) : undefined
        return {
            ProductViewDetails,
            nextPage
        }
    }
    return searchProducts()
}

export async function ListPortfolios(catalog: ServiceCatalog) {
    const listPortfolios = async (page?: string) => {
        const { PortfolioDetails, NextPageToken} = await catalog.listPortfolios({ PageToken: page }).promise()
        const nextPage = NextPageToken ? () => listPortfolios(NextPageToken) : undefined
        console.log(PortfolioDetails)
        return {
            PortfolioDetails,
            nextPage
        }
    }
    return listPortfolios()
}

export async function ListProductDetails(catalog: ServiceCatalog, productId: string) {
    const { ProductViewDetail, ProvisioningArtifactSummaries} = await catalog.describeProductAsAdmin({Id: productId}).promise()
    return { ProductViewDetail, ProvisioningArtifactSummaries}
}

export async function GetProvisioningParameters(catalog: ServiceCatalog, productId: string, artifactId: string) {
    const PathId = (await catalog.listLaunchPaths({ ProductId: productId }).promise()).LaunchPathSummaries[0].Id
    const result = await catalog.describeProvisioningParameters({ 
        ProductId: productId, ProvisioningArtifactId: artifactId, PathId }).promise()
    return result.ProvisioningArtifactParameters
}
