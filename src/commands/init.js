const inquirer = require('inquirer');

async function askConfig() {
    const { default: inquirerPrompt } = await import('inquirer');
    return inquirerPrompt.prompt([
        {
            type: 'input',
            name: 'prodBranch',
            message: 'Qual branch será usado para PRODUÇÃO?',
            default: 'main'
        },
        {
            type: 'input',
            name: 'devBranch',
            message: 'Qual branch será usado para HOMOLOGAÇÃO?',
            default: 'develop'
        }
    ]);
}

module.exports = async () => {
    const answers = await askConfig();
    const { setConfig } = require('../config');

    setConfig('prod-branch', answers.prodBranch);
    setConfig('dev-branch', answers.devBranch);

    const log = require('../utils/log');
    log.success('Configuração salva com sucesso!');

    // Cria as branches se não existirem
    require('../utils/git').ensureBranchesExist(answers.prodBranch, answers.devBranch);
};
