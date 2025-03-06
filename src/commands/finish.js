const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ force }) => {
    const currentBranch = git.getCurrentBranch();

    // verifica se existem commits pendentes
     git.ensureCleanWorkingDirectory();

    // Verifica se está em uma task
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "finish" só pode ser executado em uma branch de task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    const { devBranch } = getBranches();

    log.info(`Verificando se já foi feito deploy da task "${currentBranch}" para "${devBranch}"...`);

    if (git.isMerged(currentBranch, devBranch) || force) {
        git.checkout(devBranch);
        git.pull();
        git.deleteBranch(currentBranch, force);
        log.success(`Task "${currentBranch}" finalizada e removida.`);
    } else {
        log.warn('Use "git-task deploy homolog" para enviar a tarefa para o ambiente de homologação.');
        log.warn('Use "git-task finish --force" para forçar a exclusão.');
        log.error(`Ainda não foi feito deploy da task "${currentBranch}" para homologação.`);
    }
};
