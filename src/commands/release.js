const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const fs = require('fs');

module.exports = async ({ action, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const currentBranch = git.getCurrentBranch();

    if (action === 'homolog' || action === 'production') {
        const baseBranch = action === 'production' ? prodBranch : devBranch;
        const isBeta = action !== 'production';
        const originalBranch = currentBranch;

        git.ensureCleanWorkingDirectory();
        git.checkout(baseBranch);
        git.pull();

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let currentVersion = packageJson.version;

        log.info(`📦 Versão atual: ${currentVersion}`);
        log.info(`🚀 Criando release para ${action}...`);

        try {
            log.info(`🔥 Gerando versão ${isBeta ? 'beta' : 'estável'} manualmente...`);
            const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(-beta\.(\d+))?$/);
            if (!versionMatch) {
                throw new Error(`❌ Erro ao interpretar a versão atual: ${currentVersion}`);
            }

            let major = parseInt(versionMatch[1]) || 0;
            let minor = parseInt(versionMatch[2]) || 0;
            let patch = parseInt(versionMatch[3]) || 0;
            let betaNumber = versionMatch[5] ? parseInt(versionMatch[5]) : null;
            let newVersion;

            if (isBeta) {
                if (betaNumber !== null) {
                    betaNumber++;
                } else {
                    if (type === 'major') { major++; minor = 0; patch = 0; }
                    else if (type === 'minor') { minor++; patch = 0; }
                    else { patch++; }
                    betaNumber = 1;
                }
                newVersion = `${major}.${minor}.${patch}-beta.${betaNumber}`;
            } else {
                if (type === 'major') { major++; minor = 0; patch = 0; }
                else if (type === 'minor') { minor++; patch = 0; }
                else { patch++; }
                newVersion = `${major}.${minor}.${patch}`;
            }

            packageJson.version = newVersion;
            fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
            log.info(`📌 Nova versão gerada: ${newVersion}`);

            const releaseBranch = `release/${newVersion}`;
            git.createBranch(releaseBranch);

            git.run(`git add package.json`);
            git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
            git.run(`git tag -a v${newVersion} -m "🚀 Release ${newVersion}"`);
            git.run(`git push -u origin ${releaseBranch}`);
            git.pushTags();

            log.success(`✅ Release ${newVersion} criada na branch ${releaseBranch}!`);
            log.info(`\x1b[34mℹ️  Branch criada: ${releaseBranch}\nExemplo de deploy para esse release:\n  git-task deploy ${newVersion}\x1b[0m`);
            git.checkout(originalBranch);
        } catch (error) {
            log.error(`❌ Erro ao criar release: ${error.message}`);
            git.checkout(originalBranch);
            process.exit(1);
        }
        return;
    }

    if (action === 'publish') {
        if (!currentBranch.startsWith('release/')) {
            log.error('O comando "release publish" deve ser executado em uma branch de release.');
            process.exit(1);
        }
        git.ensureCleanWorkingDirectory();
        const version = currentBranch.replace('release/', '');
        const isBeta = version.includes('beta');
        const targetBranch = isBeta ? devBranch : prodBranch;

        try {
            git.checkout(targetBranch);
            git.pull();
            git.merge(currentBranch);
            git.push();

            if (!isBeta) {
                git.checkout(devBranch);
                git.pull();
                git.merge(currentBranch);
                git.push();
            }

            git.pushTags();
            git.checkout(currentBranch);
            log.success(`✅ Release ${version} publicada em ${targetBranch}!`);
        } catch (error) {
            log.error(`❌ Erro ao publicar release: ${error.message}`);
            git.checkout(currentBranch);
            process.exit(1);
        }
        return;
    }

    if (action === 'finish') {
        if (!currentBranch.startsWith('release/')) {
            log.error('O comando "release finish" deve ser executado em uma branch de release.');
            process.exit(1);
        }
        git.ensureCleanWorkingDirectory();
        const version = currentBranch.replace('release/', '');
        const isBeta = version.includes('beta');
        const targetBranch = isBeta ? devBranch : prodBranch;

        if (!git.isMerged(currentBranch, targetBranch)) {
            log.error(`O release ${currentBranch} ainda não foi publicado em ${targetBranch}.`);
            process.exit(1);
        }

        try {
            git.checkout(targetBranch);
            git.deleteBranch(currentBranch);
            log.success(`✅ Release ${version} finalizado!`);
        } catch (error) {
            log.error(`❌ Erro ao finalizar release: ${error.message}`);
            process.exit(1);
        }
        return;
    }

    log.error('Ação de release inválida.');
    process.exit(1);
};
