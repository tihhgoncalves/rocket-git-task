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

      // Simula merge para verificar conflitos antes de continuar
			const result = git.run(`git merge --no-commit --no-ff ${currentBranch}`, {
					stdio: "pipe",
					allowError: true,
			});
			
			// Aborta o merge SEMPRE, com ou sem conflito
			git.run("git merge --abort");
			
			// Se houver conflito, avisa e sai
			if (result.stderr && result.stderr.includes("CONFLICT")) {
					log.error(`Conflito detectado! Resolva os conflitos na sua task com "git-task update ${target}" antes de fazer o deploy.`);
					git.checkout(currentBranch);
					process.exit(1);
			}
  
      // Faz o merge com squash, permitindo conflitos
      log.info(`Preparando o merge squash de "${currentBranch}" em "${targetBranch}"...`);
      git.run(`git merge --squash ${currentBranch}`);
      git.run(`git commit -m "🚀 Deploy da task ${currentBranch} para ${targetBranch}"`);
      git.push();


      log.success(`Deploy da task "${currentBranch}" para "${target}" concluído com sucesso!`);

      // Volta para a branch original
      git.checkout(currentBranch);

    } catch (error) {
        log.error(`Erro ao tentar fazer o deploy: ${error.message}`);
        process.exit(1);
    }
};
