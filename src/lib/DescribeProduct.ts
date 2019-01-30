import { Observable, defer, EMPTY } from 'rxjs';
import { map, flatMap, expand } from 'rxjs/operators'
import { ServiceCatalog } from 'aws-sdk'

export function SearchProducts$(catalog: ServiceCatalog, portfolioId: string, product: string): Observable<ServiceCatalog.ProductViewDetail> {
    const filter = !product ? null : {
        'FullTextSearch': [product]
    }

    const searchProducts$ = (page?: string): Observable<ServiceCatalog.SearchProductsAsAdminOutput> =>
        defer(() => catalog.searchProductsAsAdmin({ PortfolioId: portfolioId, PageToken: page, Filters: filter }).promise())

    return searchProducts$()
        .pipe(expand<ServiceCatalog.SearchProductsAsAdminOutput>(({ NextPageToken }) => NextPageToken ? 
            searchProducts$(NextPageToken): EMPTY))
        .pipe(flatMap(r => r.ProductViewDetails))
}

export function DescribeProductAsAdmin$(catalog: ServiceCatalog, productId: string): Observable<ServiceCatalog.DescribeProductAsAdminOutput> {
    return defer(() => catalog.describeProductAsAdmin({Id: productId}).promise())
}

export function DescribeProvisioningParameters$(catalog: ServiceCatalog, productId: string, artifactId: string): Observable<ServiceCatalog.ProvisioningArtifactParameters> {
    const describeParameters$ = (): Observable<ServiceCatalog.DescribeProvisioningParametersOutput> => 
        defer(() => catalog.describeProvisioningParameters({ 
            ProductId: productId, ProvisioningArtifactId: artifactId }).promise())
    
    return describeParameters$().pipe(map(r => r.ProvisioningArtifactParameters))
}
