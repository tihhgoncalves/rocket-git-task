const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ force }) => {
    const currentBranch = git.getCurrentBranch();
    const { devBranch } = getBranches();

    git.ensureCleanWorkingDirectory();

    log.info(`Verificando se a task "${currentBranch}" já foi mergeada em "${devBranch}"...`);

    if (git.isMerged(currentBranch, devBranch) || force) {
        git.checkout(devBranch);
        git.pull();
        git.deleteBranch(currentBranch, force);
        log.success(`Task "${currentBranch}" finalizada e removida.`);
    } else {
        log.warn(`A task "${currentBranch}" ainda não foi mergeada.`);
        log.warn('Use "git task finish --force" para forçar a exclusão.');
    }
};
