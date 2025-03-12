#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { version } = require('../package.json');

const init = require('./commands/init');
const create = require('./commands/create');
const deploy = require('./commands/deploy');
const release = require('./commands/release');
const finish = require('./commands/finish');
const update = require('./commands/update');

yargs(hideBin(process.argv))
    .usage(`
        
    🚀 ROCKET GIT-TASK - Automação de Fluxo de Trabalho no Git

    O Rocket Git-Task é uma ferramenta de automação para gerenciar tasks, deploys e releases no Git de forma simplificada.
    
    📌 Autor: @tihhgoncalves

    🔹 Uso: git-task <comando> [opções]

    📌 Targets disponíveis:
    - homolog      (Homologação)
    - production   (Produção)

    📌 Comandos disponíveis:
    - init         Inicializa o Rocket Git-Task no repositório
    - create       Cria uma nova task no fluxo de desenvolvimento
    - deploy       Faz deploy da task para homologação ou produção
    - release      Gera um release oficial do projeto
    - finish       Finaliza uma task após o merge para produção
    - update       Atualiza a task com mudanças do develop
    `)
    .command('init', '📌 Inicializa o Rocket Git-Task no repositório', () => {}, init)
    .command('create <name>', '📌 Cria uma nova task no fluxo de desenvolvimento', (yargs) => {
        yargs.positional('name', {
            describe: 'Nome da task',
            type: 'string'
        });
    }, create)
    .command('deploy <target>', '📌 Faz deploy da task para homologação ou produção', (yargs) => {
        yargs.positional('target', {
            describe: 'Destino do deploy',
            type: 'string',
            choices: ['homolog', 'production']
        });
    }, deploy)
    .command('release <target>', '📌 Gera um release oficial do projeto', (yargs) => {
        yargs.positional('target', {
            describe: 'Destino do release',
            type: 'string',
            choices: ['homolog', 'production']
        });
    }, release)
    .command('finish', '📌 Finaliza a task atual após o deploy', (yargs) => {
        yargs.option('force', {
            alias: 'f',
            type: 'boolean',
            description: 'Força a finalização da task sem verificar o merge'
        });
    }, finish)
    .command('update', '📌 Atualiza a task atual com as mudanças do develop', () => {}, update)
    .help()
    .version(`🚀 Rocket Git-Task v${version}`)
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
