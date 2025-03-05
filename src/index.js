#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const init = require('./commands/init');
const create = require('./commands/create');
const deploy = require('./commands/deploy');
const release = require('./commands/release');
const finish = require('./commands/finish');

yargs(hideBin(process.argv))
    .command('init', 'Inicializa a configuração do Git Task', () => {}, init)
    .command('create <name>', 'Cria uma nova task', (yargs) => {
        yargs.positional('name', {
            describe: 'Nome da task',
            type: 'string'
        });
    }, create)
    .command('deploy <target>', 'Faz deploy para homolog ou produção', (yargs) => {
        yargs.positional('target', {
            describe: 'Destino: homolog ou production',
            type: 'string',
            choices: ['homolog', 'production']
        });
    }, deploy)
    .command('release <target>', 'Cria uma release para homolog ou produção', (yargs) => {
        yargs.positional('target', {
            describe: 'Destino: homolog ou production',
            type: 'string',
            choices: ['homolog', 'production']
        });
    }, release)
    .command('finish', 'Finaliza a task atual', (yargs) => {
        yargs.option('force', {
            alias: 'f',
            type: 'boolean',
            description: 'Força a finalização mesmo sem merge'
        });
    }, finish)
    .help()
    .alias('h', 'help')
    .version('1.0.0')
    .argv;
