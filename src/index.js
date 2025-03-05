#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { version } = require('../package.json');

const init = require('./commands/init');
const create = require('./commands/create');
const deploy = require('./commands/deploy');
const release = require('./commands/release');
const finish = require('./commands/finish');

yargs(hideBin(process.argv))
    .usage(`[Rocket Git-Task]

    O Rocket Git Task é uma ferramenta de automação para gerenciar tarefas no Git de forma simplificada.
    
    Autor: @tihhgoncalves
    
    Uso: git-task <comando> [opções]

    Targets disponíveis:
    - homolog
    - production
    `)
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
    .version(`Rocket Git-Task v${version}`)
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .fail((msg, err, yargs) => {
        if (err) throw err; // erros internos (ex: require errado) ainda devem quebrar

        console.log('\n❌ ERRO DE COMANDO!\n\n', msg, '\n');
        console.log(yargs.help());
        process.exit(1);
    })
    .argv;
