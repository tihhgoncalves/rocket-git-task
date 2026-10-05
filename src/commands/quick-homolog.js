const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const fs = require('fs');
const { nextHomologVersion, restoreFileContents } = require('../utils/release-safety');

module.exports = async ({ noFinish }) => {
    const { devBranch } = getBranches();
    const currentBranch = git.getCurrentBranch();

    // Verifica se está em uma task
    if (!currentBranch.startsWith('task/')) {
        log.error(`O comando "quick-homolog" só pode ser executado dentro de uma task.`);
        log.error(`Você está na branch "${currentBranch}".`);
        process.exit(1);
    }

    // Verifica se existem arquivos não comittados
    git.ensureCleanWorkingDirectory();

    let releaseBranch;
    let packageJsonBeforeBump;
    let releaseBranchCreated = false;
    let releaseBranchPushed = false;

    try {
        log.info(`\n🚀 Iniciando fluxo rápido de homologação para a task "${currentBranch}"...\n`);

        // ========== PASSO 1: CRIAR RELEASE HOMOLOG ==========
        log.info(`📦 [1/4] Criando release para homologação...`);
        const originalBranch = currentBranch;

        git.checkout(devBranch);
        git.pull();

        packageJsonBeforeBump = fs.readFileSync('package.json', 'utf8');
        const packageJson = JSON.parse(packageJsonBeforeBump);
        const newVersion = nextHomologVersion(packageJson.version);
        releaseBranch = `release/${newVersion}`;

        if (git.branchExists(releaseBranch)) {
            throw new Error(
                `A release "${releaseBranch}" já existe. Retome-a com "git checkout ${releaseBranch}" ou crie a próxima versão beta.`,
            );
        }

        // Cria a branch antes de modificar arquivos, evitando worktree sujo se ela já existir.
        git.createBranch(releaseBranch);
        releaseBranchCreated = true;
        packageJson.version = newVersion;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

        git.run(`git add package.json`);
        git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
        git.run(`git push -u origin ${releaseBranch}`);
        releaseBranchPushed = true;

        log.success(`✅ Release ${newVersion} criada!`);

        // ========== PASSO 2: FAZER DEPLOY DA TASK ==========
        log.info(`\n🚀 [2/4] Fazendo deploy da task para o release...`);

        git.checkout(originalBranch);
        git.checkout(releaseBranch);
        git.pull();

        log.info(`Preparando o merge da task "${originalBranch}" para "${releaseBranch}"...`);
        git.run(`git merge --squash ${originalBranch}`);
        
        // Verifica se há mudanças para fazer commit
        const status = git.run(`git status --porcelain`).trim();
        
        if (status) {
            // Há mudanças, faz o commit
            git.run(`git commit -m "🚀 Deploy da task '${originalBranch}' para ${releaseBranch}"`);
        } else {
            // Não há mudanças, apenas informa
            log.warn(`⚠️  Nenhuma mudança para fazer commit (task já está sincronizada com o release).`);
        }
        
        git.push(releaseBranch);

        log.success(`✅ Deploy da task concluído!`);

        // ========== PASSO 3: PUBLICAR O RELEASE ==========
        log.info(`\n🚀 [3/4] Publicando release em ${devBranch}...`);

        git.checkout(devBranch);
        git.pull();
        git.merge(releaseBranch);
        git.push();

        // Cria e envia a tag
        git.run(`git tag -a v${newVersion} -m "🚀 Release ${newVersion}"`);
        git.pushTags();

        log.success(`✅ Release ${newVersion} publicada com sucesso em ${devBranch}!`);

        // ========== PASSO 4: FINALIZAR RELEASE ==========
        if (!noFinish) {
            log.info(`\n🚀 [4/4] Finalizando release (deletando branch)...`);

            git.checkout(devBranch);
            git.deleteBranch(releaseBranch);

            log.success(`✅ Release finalizado e branch deletada!`);
        } else {
            log.info(`\n⏭️  [4/4] Pulando finalização (--no-finish foi usado)`);
            log.info(`Branch de release '${releaseBranch}' foi mantida.`);
        }

        // ========== RESUMO FINAL ==========
        log.success(`\n✨ SUCESSO! Fluxo de homologação rápida concluído!\n`);
        log.info(`📌 Resumo do que foi feito:`);
        log.info(`   ✓ Release criada: ${newVersion}`);
        log.info(`   ✓ Task fez deploy para o release`);
        log.info(`   ✓ Release publicada em ${devBranch}`);
        if (!noFinish) {
            log.info(`   ✓ Release finalizada e branch deletada`);
        } else {
            log.info(`   ⏸️  Release em espera (branch ${releaseBranch} ainda existe)`);
        }
        log.info(`   ℹ️  Task original "${originalBranch}" continua intacta para novos desenvolvimentos\n`);

        git.checkout(originalBranch);

    } catch (error) {
        log.error(`\n❌ Erro durante o fluxo de homologação rápida: ${error.message}\n`);

        // O worktree iniciou limpo; portanto, qualquer pendência foi criada por este fluxo.
        const mergeRollback = git.rollbackMerge();
        if (mergeRollback === 'reset') {
            log.info('Conflito do merge de deploy desfeito; a release foi mantida para retomada.');
        }

        try {
            const packageJsonHasPendingChanges = git.run('git status --porcelain -- package.json');
            if (packageJsonBeforeBump && packageJsonHasPendingChanges && fs.existsSync('package.json')) {
                git.run('git restore --staged package.json');
                restoreFileContents('package.json', packageJsonBeforeBump);
            }
        } catch (restoreError) {
            log.error(`Não foi possível restaurar package.json automaticamente: ${restoreError.message}`);
        }

        try {
            git.checkout(currentBranch);
        } catch (e) {
            log.error(`Não foi possível retornar à branch "${currentBranch}": ${e.message}`);
        }

        if (releaseBranchCreated && !releaseBranchPushed) {
            try {
                git.deleteLocalBranch(releaseBranch);
            } catch (deleteError) {
                log.warn(`Não foi possível remover a release local temporária "${releaseBranch}".`);
            }
        }
        process.exit(1);
    }
};
