import yargs from 'yargs';

export const scdk = yargs
    .scriptName('scdk')
    .usage('Usage: $<cmd> [args]')
    .command(require('./cmd/describe'))
    // .commandDir('cmd', {
    //     extensions: ['js', 'ts'],
    //     visit: console.log
    // })
    .demandCommand()
    .help();
