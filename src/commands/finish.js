const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ force }) => {
    const currentBranch = git.getCurrentBranch();
    const { prodBranch } = getBranches();

    try {
        // Verifica se existem commits pendentes
        git.ensureCleanWorkingDirectory();

        // Verifica se está em uma task
        if (!currentBranch.startsWith('task/')) {
            log.error(`O comando "finish" só pode ser executado em uma branch de task.`);
            log.error(`Você está na branch "${currentBranch}".`);
            process.exit(1);
        }

        // Atualiza a branch de produção antes da verificação
        git.checkout(prodBranch);
        git.pull();

        log.info(`Verificando se a task "${currentBranch}" já foi enviada para produção...`);

        // Verifica se há um commit de deploy da task na main
        const deployCommit = git.run(`git log ${prodBranch} --grep="Deploy da ${currentBranch}"`);

        if (!deployCommit.trim() && !force) {
            log.error(`A task "${currentBranch}" ainda não foi enviada para produção.`);
            log.warn(`Use "git-task deploy production" para enviá-la.`);
            log.warn(`Ou use "git-task finish --force" para forçar a exclusão.`);
            git.checkout(currentBranch);
            process.exit(1); // Garante que o processo será encerrado
            return; 
        }

        // Se chegou aqui, pode finalizar a task
        git.deleteBranch(currentBranch, force);
        log.success(`Task "${currentBranch}" finalizada e removida.`);
        git.checkout(prodBranch); //fica na produção
    } catch (error) {
        log.error(error.message);
    }
};
