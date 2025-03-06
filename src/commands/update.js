const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async () => {
    const currentBranch = git.getCurrentBranch();
    const { devBranch } = getBranches();

    // Verifica se está em uma task
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "update" só pode ser executado em uma branch de task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    log.info(`Atualizando a task "${currentBranch}" com as últimas alterações de "${devBranch}"...`);

    try {
        // Garante que develop está atualizado antes do rebase
        git.checkout(devBranch);
        git.pull();

        // Volta pra task atual e executa o rebase
        git.checkout(currentBranch);
        git.run(`git rebase ${devBranch}`);

        log.success(`Task "${currentBranch}" atualizada com sucesso!`);
    } catch (error) {
        log.error(`Falha ao atualizar a task "${currentBranch}".`);
        log.error(`Erro: ${error.message}`);
        process.exit(1);
    }
};
