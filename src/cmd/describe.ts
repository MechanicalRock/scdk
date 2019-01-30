import { Argv } from 'yargs'

// import {
//     SearchProvisionedProducts$,
//     DescribeRecordOutputs$,
//     DescribeProvisioningArtifact$,
//     DescribeParameters$
// } from '../lib/DescribeProvisionedProduct'

module.exports = {
    command: 'describe',
    describe: 'describe the element',
    builder: (yargs: Argv) => {
        return yargs.commandDir('describe_cmds', {
            extensions: ['js', 'ts'],
        })
    },
    handler: async () => {}
}

// interface DescribeProvisionedProductView {
//     productId: string
//     artifactId: string
//     lastRecordId: string
//     name: string
//     description: string
//     version: string
//     stackArn: string
//     parameters: Partial<DescribeProvisionedProductParameter>
//     outputs: Partial<DescribeProvisionedProductOutput>
// }

// interface DescribeProvisionedProductParameter {
//     name: string
//     description: string
//     value: string
// }

// interface DescribeProvisionedProductOutput {
//     name: string
//     description: string
//     value: string
// }




// function ProjectValuesFromSearchProvisionedProducts(view: Partial<DescribeProvisionedProductView>, record: ServiceCatalog.ProvisionedProductAttribute): Partial<DescribeProvisionedProductView> {
//     return Object.assign(view, {
//         productId: record.ProductId,
//         artifactId: record.ProvisioningArtifactId,
//         lastRecordId: record.LastRecordId
//     })
// }

// function ProjectValuesFromRecordOutputs(view: Partial<DescribeProvisionedProductView>, records: ServiceCatalog.RecordOutputs): Partial<DescribeProvisionedProductView> {
//     const outputs = records.map(r => ({ name: r.OutputKey, value: r.OutputValue, description: r.Description}))
//     const stackArnRecord = outputs.find(o => o.name === 'CloudformationStackARN')
//     const stackArn = stackArnRecord ? stackArnRecord.value : 'Unknown'
//     return Object.assign(view, { outputs }, { stackArn })
// }

// function ProjectValuesFromArtifactDetail(view: Partial<DescribeProvisionedProductView>, record: ServiceCatalog.ProvisioningArtifactDetail): Partial<DescribeProvisionedProductView> {
//     return Object.assign(view, {
//         version: record.Name,
//         description: record.Description
//     })
// }

// function ProjectValuesFromCfnParameters(view: Partial<DescribeProvisionedProductView>, records: CloudFormation.Parameter[]): Partial<DescribeProvisionedProductView> {
//     const parameters = records.map(r => ({
//         name: r.ParameterKey,
//         value: r.ParameterValue
//     }))
//     return Object.assign(view, { parameters } )
// }

// map<T, U>(initialValue: T, item: U): T {
//
// }
//



// function DescribeProvisionedProducts$(product: string) {
//     const catalog = new ServiceCatalog(new Config())
//     const cfn = new CloudFormation(new Config())

//     return SearchProvisionedProducts$(catalog, product).pipe(
//         map(p => ProjectValuesFromSearchProvisionedProducts({}, p)),
//         flatMap(v => {
//             const items$ = DescribeRecordOutputs$(catalog, v.lastRecordId)
//                 .pipe(
//                     map(output => ProjectValuesFromRecordOutputs(v, output))
//                 )
//             return items$
//         }),
//         flatMap(v => {
//             const items$ = DescribeProvisioningArtifact$(catalog, v.productId, v.artifactId)
//                 .pipe(
//                     map(d => ProjectValuesFromArtifactDetail(v, d))
//                 )
//             return items$
//         }),
//         flatMap(v => {
//             const items$ = DescribeParameters$(cfn, v.stackArn)
//                 .pipe(
//                     map(d => ProjectValuesFromCfnParameters(v, d))
//                 )
//             return items$
//         })
//     )
// }
