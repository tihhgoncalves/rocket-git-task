const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async () => {

    // seleciona branchs
    const currentBranch = git.getCurrentBranch();
    const { prodBranch } = getBranches();

    // Verifica se está em uma task (obrigatório)
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "update" só pode ser executado em uma branch de task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    // Verifica se existem arquivos não comittados
    git.ensureCleanWorkingDirectory();

    log.info(`Atualizando a task "${currentBranch}" com as últimas alterações de "${prodBranch}"...`);

    try {
        // Atualiza a branch de produção local com a versão mais recente
        git.run('git fetch origin');
        
        // Garante que branch de PROD está atualizado antes do merge
        git.checkout(prodBranch);
        git.pull();

        // Volta pra task atual e executa o rebase
        git.checkout(currentBranch);

        // Faz o merge com mensagem customizada
        git.run(`git merge origin/${prodBranch} -m "update: sincronizando com '${prodBranch}'"`);

        log.success(`Task "${currentBranch}" atualizada com sucesso!`);
        
    } catch (error) {
        log.error(`Falha ao atualizar a task "${currentBranch}".`);
        log.error(`Erro: ${error.message}`);
        process.exit(1);
    }
};
