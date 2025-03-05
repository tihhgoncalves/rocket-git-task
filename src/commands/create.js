const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');

module.exports = async ({ name }) => {
    const { devBranch } = getBranches();

    git.ensureCleanWorkingDirectory();

    git.checkout(devBranch);
    git.pull();
    git.createBranch(`task/${name}`);
    log.success(`Task "${name}" criada com sucesso!`);
};
