import yargs from 'yargs';

export const scdk = yargs
    .scriptName('scdk')
    .usage('Usage: $<cmd> [args]')
    .commandDir('cmd', {
        extensions: ['js', 'ts'],
    })
    .demandCommand()
    .help();
