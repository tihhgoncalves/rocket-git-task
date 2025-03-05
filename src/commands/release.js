const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { execSync } = require('child_process');

module.exports = async ({ target }) => {
    const { prodBranch, devBranch } = getBranches();
    const originalBranch = git.getCurrentBranch();
    const targetBranch = target === 'production' ? prodBranch : devBranch;

    git.ensureCleanWorkingDirectory();

    git.checkout(targetBranch);
    git.pull();

    log.info(`Criando release para ${target}...`);

    const versionCommand = target === 'production'
        ? 'npx standard-version'
        : 'npx standard-version --prerelease beta';

    execSync(versionCommand, { stdio: 'inherit' });
    git.push();
    git.pushTags();

    if (target === 'production') {
        git.checkout(devBranch);
        git.merge(prodBranch);
        git.push();
    }

    git.checkout(originalBranch);
    log.success('Release concluída!');
};
