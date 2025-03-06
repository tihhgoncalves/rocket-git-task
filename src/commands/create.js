const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { checkConfig } = require('../utils/git');

module.exports = async ({ name }) => {
    checkConfig();

    const { devBranch } = getBranches();

    // Garante que o develop tá atualizado
    git.checkout(devBranch);
    git.pull();

    // Cria a nova branch sem trocar de branch
    git.run(`git branch task/${name} ${devBranch}`);

    // Faz o checkout pra nova branch (levando arquivos pendentes)
    git.checkout(`task/${name}`);

    log.success(`Task "${name}" criada com sucesso!`);
};
