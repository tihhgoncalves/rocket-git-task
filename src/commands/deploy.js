const git = require('../utils/git');
const log = require('../utils/log');
const { getBranches } = require('../config');

module.exports = async ({ target }) => {
    const currentBranch = git.getCurrentBranch();
    const { devBranch, prodBranch } = getBranches();

    const targetBranch = target === 'production' ? prodBranch : devBranch;

    // Verifica se está em uma branch de task
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "deploy" só pode ser executado dentro de uma task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    // Verifica se existem arquivos não comittados
    git.ensureCleanWorkingDirectory();

    log.info(`Fazendo deploy da task "${currentBranch}" para "${targetBranch}"...`);

    try {
      // Checkout na branch de destino (develop ou production)
      git.checkout(targetBranch);
      git.pull();

      // Faz o merge com squash, permitindo conflitos
      log.info(`Preparando o merge da task "${currentBranch}" para "${targetBranch}"...`);
      git.run(`git merge --squash ${currentBranch}`);

      // Faz o commit com mensagem personalizada
      git.run(
        `git commit -m "🚀 Deploy da task '${currentBranch}' para ${targetBranch}"`
      );

      git.push(targetBranch);

      // Volta para a branch original
      git.checkout(currentBranch);

      log.success(`Deploy da task "${currentBranch}" concluído com sucesso!`);
    } catch (error) {
        log.error(`Falha ao fazer deploy da task "${currentBranch}".`);
        log.error(`Erro: ${error.message}`);
        process.exit(1);
    } finally {
        // garante que no final sempre volta pra branch original
        git.checkout(currentBranch);   
    }
};
