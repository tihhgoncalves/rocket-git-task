const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const fs = require('fs');

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

    try {
        log.info(`\n🚀 Iniciando fluxo rápido de homologação para a task "${currentBranch}"...\n`);

        // ========== PASSO 1: CRIAR RELEASE HOMOLOG ==========
        log.info(`📦 [1/4] Criando release para homologação...`);
        const originalBranch = currentBranch;

        git.checkout(devBranch);
        git.pull();

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let currentVersion = packageJson.version;

        const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(-beta\.(\d+))?$/);
        if (!versionMatch) {
            throw new Error(`❌ Erro ao interpretar a versão atual: ${currentVersion}`);
        }

        let major = parseInt(versionMatch[1]) || 0;
        let minor = parseInt(versionMatch[2]) || 0;
        let patch = parseInt(versionMatch[3]) || 0;
        let betaNumber = versionMatch[5] ? parseInt(versionMatch[5]) : null;

        // Incrementa versão beta
        if (betaNumber !== null) {
            betaNumber++;
        } else {
            patch++;
            betaNumber = 1;
        }

        const newVersion = `${major}.${minor}.${patch}-beta.${betaNumber}`;
        packageJson.version = newVersion;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

        const releaseBranch = `release/${newVersion}`;
        git.createBranch(releaseBranch);
        git.run(`git add package.json`);
        git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
        git.run(`git push -u origin ${releaseBranch}`);

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
        try {
            git.checkout(currentBranch);
        } catch (e) {
            // ignora erro ao voltar
        }
        process.exit(1);
    }
};
