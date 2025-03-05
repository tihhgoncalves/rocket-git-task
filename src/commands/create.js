const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { checkConfig } = require('../utils/git');

module.exports = async ({ name }) => {
    
    checkConfig();

    const { devBranch } = getBranches();


    git.ensureCleanWorkingDirectory();

    git.checkout(devBranch);
    git.pull();
    git.createBranch(`task/${name}`);
    log.success(`Task "${name}" criada com sucesso!`);
};
