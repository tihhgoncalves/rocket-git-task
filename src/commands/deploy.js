const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');

module.exports = async ({ target }) => {
    const { prodBranch, devBranch } = getBranches();
    const originalBranch = git.getCurrentBranch();

    git.ensureCleanWorkingDirectory();

    if (target === 'homolog') {
        log.info('Fazendo deploy para homologação...');
        git.checkout(devBranch);
        git.merge(originalBranch);
        git.push();
    } else if (target === 'production') {
        log.info('Fazendo deploy para produção...');
        git.checkout(prodBranch);
        git.merge(devBranch);
        git.push();
    }

    git.checkout(originalBranch);
    log.success('Deploy concluído!');
};
