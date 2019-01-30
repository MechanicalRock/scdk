import { Observable, defer, EMPTY } from 'rxjs';
import { flatMap, map, expand } from 'rxjs/operators'
import { ServiceCatalog, CloudFormation } from 'aws-sdk'

export function SearchProvisionedProducts$(catalog: ServiceCatalog, product: string): Observable<ServiceCatalog.ProvisionedProductAttribute> {
    const filter = !product ? null : {
        'SearchQuery': [`name:${product}`]
    }

    const searchProvisionedProducts$ = (page?: string): Observable<ServiceCatalog.SearchProvisionedProductsOutput> =>
        defer(() => catalog.searchProvisionedProducts({ PageToken: page, Filters: filter }).promise())

    return searchProvisionedProducts$()
        .pipe(expand<ServiceCatalog.SearchProvisionedProductsOutput>(({ NextPageToken }) => NextPageToken ? 
            searchProvisionedProducts$(NextPageToken): EMPTY))
        .pipe(flatMap(r => r.ProvisionedProducts))
}

export function DescribeRecordOutputs$(catalog: ServiceCatalog, recordId: string): Observable<ServiceCatalog.RecordOutputs> {
    return defer(() => catalog.describeRecord({ Id: recordId}).promise())
        .pipe(
            map(r => r.RecordOutputs)
        )
}

export function DescribeProvisioningArtifact$(catalog: ServiceCatalog, productId: string, artifactId: string): Observable<ServiceCatalog.ProvisioningArtifactDetail> {
    return defer(() => catalog.describeProvisioningArtifact({ ProvisioningArtifactId: artifactId, ProductId: productId}).promise())
        .pipe(map(r => r.ProvisioningArtifactDetail))
}

export function DescribeParameters$(cfn: CloudFormation, stackArn: string) {
    return defer(() => cfn.describeStacks({ StackName: stackArn}).promise())
        .pipe(
            map(r => r.Stacks[0].Parameters)
        )
}