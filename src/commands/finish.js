const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ force }) => {
    const currentBranch = git.getCurrentBranch();
    const { prodBranch } = getBranches();

    try {
        // Verifica se existem commits pendentes
        git.ensureCleanWorkingDirectory();

        // Verifica se está em uma task
        if (!currentBranch.startsWith('task/')) {
            log.error(`O comando "finish" só pode ser executado em uma branch de task.`);
            log.error(`Você está na branch "${currentBranch}".`);
            process.exit(1);
        }

        // Atualiza a branch de produção antes da verificação
        git.checkout(prodBranch);
        git.pull();

        log.info(`Verificando se a task "${currentBranch}" já foi enviada para produção...`);

        // Verifica se há um commit de deploy da task na main
        const deployCommit = git.run(`git log ${prodBranch} --grep="Deploy da ${currentBranch}"`);

        if (!deployCommit && !force) {
            throw new Error(`A task "${currentBranch}" ainda não foi enviada para produção.`);
        }

        // Verifica se há commits na task que não estão na produção
        const commitsNaoEnviados = git.run(`git log ${prodBranch}..${currentBranch} --oneline`);

        if (commitsNaoEnviados && !force) {
            throw new Error(`A task "${currentBranch}" tem commits que ainda não foram enviados para produção.`);
        }

        // Se chegou aqui, pode finalizar a task
        git.deleteBranch(currentBranch, force);
        log.success(`Task "${currentBranch}" finalizada e removida.`);
    } catch (error) {
        log.error(error.message);
        log.warn(`Use "git-task deploy production" para enviá-la.`);
        log.warn(`Ou use "git-task finish --force" para forçar a exclusão.`);
    } finally {
        // Sempre volta para a branch original se houver erro
        git.checkout(currentBranch);
    }

    // Se chegou aqui, pode finalizar a task
    git.checkout(prodBranch);
    git.pull();
    git.deleteBranch(currentBranch, force);
    log.success(`Task "${currentBranch}" finalizada e removida.`);
};
