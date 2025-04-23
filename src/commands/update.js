const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ target }) => {
    // seleciona branchs
    const currentBranch = git.getCurrentBranch();
    const { devBranch, prodBranch } = getBranches();

    // valida target
    if (!target || (target !== 'production' && target !== 'homolog')) {
        log.error(`Você precisa especificar um target válido: "homolog" ou "production".`);
        process.exit(1);
    }
      
    const targetBranch = target === 'production' ? prodBranch : devBranch;
      
    

    // Verifica se está em uma task (obrigatório)
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "update" só pode ser executado em uma branch de task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    // Verifica se existem arquivos não comittados
    git.ensureCleanWorkingDirectory();

    log.info(`Atualizando a task "${currentBranch}" com as últimas alterações de "${targetBranch}"...`);

    try {
        // Atualiza a branch de produção/homolog local com a versão mais recente
        git.run('git fetch origin');

        // Garante que a branch alvo está atualizada antes do merge
        git.checkout(targetBranch);
        git.pull();

        // Retorna para a branch da task
        git.checkout(currentBranch);

        // Faz o merge da branch alvo na task
        git.merge(targetBranch);

        log.success(`Task atualizada com sucesso a partir de "${targetBranch}".`);
    } catch (error) {
        log.error(`Erro ao atualizar a task: ${error.message}`);
        process.exit(1);
    }
};
