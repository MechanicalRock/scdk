import { Argv } from 'yargs'

module.exports = {
    command: 'provisioned-product [products]',
    describe: 'describe the provisioned product',
    builder: (yargs: Argv) => {
        return yargs.positional('products', {
            type: 'string',
            default: '',
            describe: 'the name/s of the provisioned product/s to describe'
        })
    },
    handler: () => {
        console.log('provisioned-products') 
    }
}