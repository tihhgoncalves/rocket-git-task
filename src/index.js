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
const quickHomolog = require('./commands/quick-homolog');

yargs(hideBin(process.argv))
    .usage(`
        
    🚀 ROCKET GIT-TASK - Automação de Fluxo de Trabalho no Git

    O Rocket Git-Task é uma ferramenta de automação para gerenciar tasks, deploys e releases no Git de forma simplificada.
    
    📌 Autor: @tihhgoncalves

    🔹 Uso: git-task <comando> [opções]

    📌 Fluxo principal:
    - Crie uma task: git-task create <nome>
    - Crie um release: git-task release homolog|production
    - Faça deploy da task para um release: git-task deploy <versão>   (ex: git-task deploy 1.2.3-beta.1)
    - Publique o release: git-task release publish   (estando na branch release/<versão>)

    📌 Comandos disponíveis:
    - init         Inicializa o Rocket Git-Task no repositório
    - create       Cria uma nova task no fluxo de desenvolvimento
    - deploy       Faz deploy da task para uma branch de release (ex: 1.2.3 ou 1.2.3-beta.1)
    - release      Cria um novo release ou publica um release já criado
    - finish       Finaliza uma task após o deploy
    - update       Atualiza a task com mudanças do develop
    `)
    .command('init', '📌 Inicializa o Rocket Git-Task no repositório', () => {}, init)
    .command('create <name>', '📌 Cria uma nova task no fluxo de desenvolvimento', (yargs) => {
        yargs.positional('name', {
            describe: 'Nome da task',
            type: 'string'
        });
    }, create)
    .command('deploy <target>', '📌 Faz deploy da task para uma branch de release (ex: 1.2.3 ou 1.2.3-beta.1)', (yargs) => {
        yargs.positional('target', {
            describe: 'Versão do release de destino (ex: 1.2.3 ou 1.2.3-beta.1)',
            type: 'string'
        });
    }, deploy)
    .command('release <target>', '📌 Cria um novo release ("homolog" ou "production") ou publica um release já criado ("publish")', (yargs) => {
        yargs.positional('target', {
            describe: 'Destino do release ("homolog", "production") para criar, ou "publish" para publicar o release atual',
            type: 'string'
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
    .command('quick-homolog', '⚡ Cria release, faz deploy e publica para homologação em uma única operação', (yargs) => {
        yargs.option('no-finish', {
            alias: 'nf',
            type: 'boolean',
            description: 'Mantém a branch de release sem deletar (por padrão ela é deletada)'
        });
    }, quickHomolog)
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
