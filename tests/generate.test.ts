import { CdkProductRenderer } from '../src/lib/generate';
import { join } from 'path';
import * as nunjucks from 'nunjucks';

describe('Given an AST representing the service catalog product', () => {
    const input = [
        {
            name: 'MyProduct',
            version: 'v1',
            productId: 'prod-xyz',
            parameters: [
                {
                    name: 'parameter_one',
                    default: 'one'
                },
                {
                    name: 'parameter_two'
                }
            ],
            outputs: [
                {
                    name: 'output_one'
                },
                {
                    name: 'output_two'
                }
            ]
        }
    ]

    describe('When I run generate against the AST', () => {
        const templateDir = join(__dirname, '../src/lib/templates')
        console.log(templateDir)
        const renderer = nunjucks.configure(templateDir, {})
        const cdkProductRenderer = new CdkProductRenderer(renderer)
        const source = cdkProductRenderer.generate('cdk-product.ts.njk', input[0])

        it('then it should produce the correct typescript source', () => {
            expect(source).toMatchSnapshot()
        })
    })
})