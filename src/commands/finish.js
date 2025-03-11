const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ force }) => {
    const currentBranch = git.getCurrentBranch();

    // Verifica se existem commits pendentes
    git.ensureCleanWorkingDirectory();

    // Verifica se está em uma task
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "finish" só pode ser executado em uma branch de task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    const { prodBranch } = getBranches();

    log.info(`Verificando se a task "${currentBranch}" já foi enviada para produção...`);

    if (!git.isMerged(currentBranch, prodBranch) && !force) {
        log.error(`A task "${currentBranch}" ainda não foi enviada para produção.`);
        log.warn(`Use "git-task deploy production" para enviá-la.`);
        log.warn(`Ou use "git-task finish --force" para forçar a exclusão.`);
        process.exit(1);
    }

    // Se chegou aqui, pode finalizar a task
    git.checkout(prodBranch);
    git.pull();
    git.deleteBranch(currentBranch, force);
    log.success(`Task "${currentBranch}" finalizada e removida.`);
};
