const AWSMock = require('aws-sdk-mock');
import AWS = require('aws-sdk');
import yargs = require('yargs');

AWSMock.setSDKInstance(AWS);

type mockSearchProducts = Partial<AWS.ServiceCatalog.SearchProductsAsAdminOutput>;

function mockKeyedResponse<T>(reqKey: string, ts: { [key: string]: T }) {
    const fn = jest.fn()
  
    fn.mockImplementation((req, cb) => {
      const key = req[reqKey];
      if (!key || !(key in ts)) {
        cb(new Error(`Object with key ${reqKey} not in mocked set`), null)
      }
      return cb(null, ts[key])
    })
  
    return fn
  }

function mockPageable<T>(...ts: T[]) {
    const fn = jest.fn()

    const results = ts.slice(0, -1).map((t, idx) => Object.assign({}, t, { NextPageToken: `${idx + 1}` }));
    results.push(Object.assign({}, ts[ts.length - 1]) as any)

    fn.mockImplementation((req: { PageToken: string | undefined }, cb) => {
        if (!req.PageToken) {
            return cb(null, results[0])
        }
        return cb(null, results[parseInt(req.PageToken, 10)])
    })
    return fn;
}

function getCmdParser(cmdPath: string, callback: jest.DoneCallback) {
    const parser = yargs
        .scriptName('scdk')
        .command(asyncifyCmd(require(cmdPath), callback))
        .help()

    return parser;
}

function asyncifyCmd(cmd: any, done: jest.DoneCallback) {
    return {
        ...cmd,
        handler: async argv => {
            try {
                await cmd.handler(argv)
                done()
            } catch (err) {
                done.fail(err)
            }
        }
    }
}

function getSnapshotContext() {
    return {
        response: msg => expect(msg).toMatchSnapshot()
    }
}

describe('Given that I am authenticated to an account with a portfolio', () => {

    beforeEach(() => {
        const searchProducts = mockPageable<mockSearchProducts>({
            ProductViewDetails: [
                {
                    ProductViewSummary: {
                        ProductId: 'prod_1',
                        Name: 'product_one',
                        ShortDescription: 'This is product one'
                    }
                }
            ]
        }, {
            ProductViewDetails: [
                {
                    ProductViewSummary: {
                        ProductId: 'prod_2',
                        Name: 'product_two',
                        ShortDescription: 'This is product two'
                    }
                }
            ]
        });

        const describeProductAsAdmin = mockKeyedResponse<AWS.ServiceCatalog.DescribeProductAsAdminOutput>('Id', {
            prod_1: {
                ProductViewDetail: {
                    ProductViewSummary: {
                        ProductId: 'prod_1',
                        Name: 'product_one',
                        ShortDescription: 'This is product one'
                    }
                },
                ProvisioningArtifactSummaries: [
                    {
                        Id: 'pa-01',
                        Name: 'v1',
                        Description: 'Version 1 of product one'
                    },
                    {
                        Id: 'pa-01',
                        Name: 'v2',
                        Description: 'Version 2 of product one'
                    }
                ]
            },
            prod_2: {
                ProductViewDetail: {
                    ProductViewSummary: {
                        ProductId: 'prod_2',
                        Name: 'product_two',
                        ShortDescription: 'This is product two'
                    }
                },
                ProvisioningArtifactSummaries: [
                    {
                        Id: 'pa-01',
                        Name: 'v1',
                        Description: 'Version 1 of product two',
                    }, {
                        Id: 'pa-01',
                        Name: 'v2',
                        Description: 'Version 2 of product two'
                    } 
                ]
            }
        })

        const describeProvisioningParameters = mockKeyedResponse<AWS.ServiceCatalog.DescribeProvisioningParametersOutput>('ProvisioningArtifactId', {
            'pa-01': {
                ProvisioningArtifactParameters: [
                    {
                        ParameterKey: 'Something',
                        DefaultValue: 'default',
                        Description: 'This is a parameter'
                    }, {
                        ParameterKey: 'Something Else',
                        DefaultValue: '1',
                        Description: 'other parameter'
                    }
                ]
            },
        })

        AWSMock.mock('ServiceCatalog', 'searchProductsAsAdmin', searchProducts);
        AWSMock.mock('ServiceCatalog', 'describeProductAsAdmin', describeProductAsAdmin);
        AWSMock.mock('ServiceCatalog', 'describeProvisioningParameters', describeProvisioningParameters);
    })

    afterEach(() => {
        AWSMock.restore('ServiceCatalog', 'searchProductsAsAdmin');
        AWSMock.restore('ServiceCatalog', 'describeProductAsAdmin');
        AWSMock.restore('ServiceCatalog', 'describeProvisioningParameters');
    })

    describe('When I issue "scdk describe product"', () => {
        describe('and it includes no additional parameters', () => {
            it('Then it should return all products that are in the portfolio', async (done) => {
                const context = getSnapshotContext();
                const parser = getCmdParser('../src/cmd/describe_cmds/product', done)

                parser.parse('product', context, (err, _, output) => {
                    if (output || err) {
                        done.fail()
                    }
                })
            })
        })

        // describe('and I include a product name', () => {
        //     it('Then it should return data limited to that product', async (done) => {
        //         const context = getSnapshotContext();
        //         const parser = getCmdParser('../src/cmd/describe_cmds/product', done)

        //         parser.parse('describe product product_one', context, (err, argv, output) => {
        //             if (output || err) done.fail()
        //         })
        //     })
        // })
    })
})