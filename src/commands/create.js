const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { checkConfig } = require('../utils/git');

module.exports = async ({ name }) => {
    checkConfig();

    const {prodBranch } = getBranches();

    // Garante que o develop tá atualizado
    git.checkout(prodBranch);
    git.pull();

    // Cria a nova branch sem trocar de branch
    git.run(`git branch task/${name} ${prodBranch}`);

    // Faz o checkout pra nova branch (levando arquivos pendentes)
    git.checkout(`task/${name}`);

    log.success(`Task "${name}" criada com sucesso!`);
    log.info(`Lembrando que novas Tasks são sempre criadas com referência da branch "${prodBranch}".`);
};
