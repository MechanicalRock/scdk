export interface ProductAst {
    name: string
    productId: string
    version: string
    parameters: ProductParameter[]
    outputs?: ProductOutput[]
}

interface ProductParameter {
    name: string
    default?: string
}

interface ProductOutput {
    name: string
}

interface Renderer {
    render(template: string, obj: { products: ProductAst[]}): string
}

export class CdkProductRenderer {
    constructor(private renderer: Renderer) {}

    generate(template: string, obj: { products: ProductAst[] }): string {
        return this.renderer.render(template, obj)
    }
}