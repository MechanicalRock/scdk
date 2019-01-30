import { Argv, Arguments } from 'yargs'
import { ServiceCatalog, Config } from 'aws-sdk';
import { map, flatMap } from 'rxjs/operators'
import { default as Table, HorizontalTable, VerticalTable } from 'cli-table3'

import { 
    SearchProducts$,
    DescribeProductAsAdmin$,
    DescribeProvisioningParameters$
} from '../../lib/DescribeProduct'

module.exports = {
    command: 'product [products]',
    describe: 'describe the product',
    builder: (yargs: Argv) => {
        return yargs.positional('products', {
            type: 'string',
            default: '',
            describe: 'the name/s of the product/s to describe'
        })
    },
    handler: async (args: Arguments<{}>) => {
        return await new Promise((resolve, reject) => {
            DescribeProducts$(args.portfolio, args.product).subscribe(entry => {
                args.response(renderProductTable(entry))
            }, err => reject(err), () => resolve())
        })
    }
}

interface DescribeProductView {
    productId: string
    artifactId: string
    name: string
    description: string
    version: string
    parameters: Partial<DescribeProductParameters>[]
}

interface DescribeProductParameters {
    name: string
    description: string
    defaultValue: string
}

function renderProductTable(view: Partial<DescribeProductView>): string {
    const vTable = new Table({ style: {}}) as VerticalTable
    Object.keys(vTable.options.chars).forEach(k => vTable.options.chars[k] = '')
    vTable.push(
        { 'name:': view.name || 'Unknown' },
        { 'version:': view.version || 'Unknown' },
        { 'description:': view.description || 'N/A' },
        { 'product id:': view.productId || 'Unknown' },
        { 'version id:': view.artifactId || 'Unknown' }
    )

    const parameterHeadingTable = new Table({ style: {}}) as HorizontalTable
    Object.keys(parameterHeadingTable.options.chars)
        .forEach(k => parameterHeadingTable.options.chars[k] = ' ')
    parameterHeadingTable.options.chars['bottom-mid'] = ' '
    parameterHeadingTable.options.chars.bottom = '-'
    parameterHeadingTable.push([
        {content: 'name', hAlign: 'center'},
        {content: 'description', hAlign: 'center'},
        {content: 'default', hAlign: 'center'}
    ])

    const parameterTable = new Table({wordWrap: true, style: {}}) as HorizontalTable
    Object.keys(parameterTable.options.chars)
        .forEach(k => parameterTable.options.chars[k] = ' ')
    
    const getParameterRows = () => {
        if (!view.parameters) {
            return [[{ content: 'No parameters', colSpan: 3 }]]
        }
        return view.parameters.map(p => [
            { content: p.name || 'Unknown' },
            { content: p.description || 'N/A' },
            { content: p.defaultValue || 'N/A' }
        ])
    }
    parameterTable.push(...getParameterRows());

    ((a: HorizontalTable, b: HorizontalTable) => {
        // the following are getters that need to be executed
        // to calculate the width of other columns
        //console.log(a.width, b.width)
        a.width;
        b.width;
        const colWidths = a.options.colWidths
            .map((_, i) => Math.max(a.options.colWidths[i], b.options.colWidths[i]))
        colWidths[1] = 70 - colWidths[0] - colWidths[2]
        a.options.colWidths = colWidths
        b.options.colWidths = colWidths
    })(parameterHeadingTable, parameterTable)

    return `${vTable.toString()}\n${parameterHeadingTable.toString()}${parameterTable.toString()}`
}

function ProjectValuesFromDescribeProductsAsAdmin(input: ServiceCatalog.DescribeProductAsAdminOutput): Partial<DescribeProductView>[] {
    return input.ProvisioningArtifactSummaries.map(a => ({
        name: input.ProductViewDetail.ProductViewSummary.Name,
        version: a.Name,
        description: a.Description,
        productId: input.ProductViewDetail.ProductViewSummary.ProductId,
        artifactId: a.Id
    }))
}

function ProjectValuesFromParameters(view: Partial<DescribeProductView>, params: ServiceCatalog.ProvisioningArtifactParameters): Partial<DescribeProductView> {
    const parameters = params.map(p => ({ name: p.ParameterKey, description: p.Description, defaultValue: p.DefaultValue }))
    return Object.assign({}, view, { parameters })
}

function DescribeProducts$(portfolioId: string, product: string) {
    const catalog = new ServiceCatalog(new Config())

    // Convert products to the view model by querying out artifacts and associated parameters
    return SearchProducts$(catalog, portfolioId, product).pipe(
        flatMap(pvd => DescribeProductAsAdmin$(catalog, pvd.ProductViewSummary.ProductId)),
        flatMap(ProjectValuesFromDescribeProductsAsAdmin),
        flatMap(view => {
            const items$ = DescribeProvisioningParameters$(catalog, view.productId, view.artifactId)
                .pipe(
                    map(params => ProjectValuesFromParameters(view, params))
                )
            return items$
        })
    )
}