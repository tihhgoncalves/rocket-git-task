const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ force }) => {
    const currentBranch = git.getCurrentBranch();
    const { devBranch } = getBranches();

    git.ensureCleanWorkingDirectory();

    log.info(`Verificando se já foi feito deploy da task "${currentBranch}" para "${devBranch}"...`);

    if (git.isMerged(currentBranch, devBranch) || force) {
        git.checkout(devBranch);
        git.pull();
        git.deleteBranch(currentBranch, force);
        log.success(`Task "${currentBranch}" finalizada e removida.`);
    } else {
        log.error(`Ainda não foi feito deploy da task "${currentBranch}" para homologação.`);
        log.warn('Use "git-task deploy homolog" para enviar a tarefa para o ambiente de homologação.');
        log.warn('Use "git-task finish --force" para forçar a exclusão.');
    }
};
