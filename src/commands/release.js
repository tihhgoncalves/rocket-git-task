const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const {
    nextDevelopVersionAfterProduction,
    differsOnlyByVersion,
} = require('../utils/version');
const fs = require('fs');

function resolvePackageJsonVersionConflict() {
    const conflictedFiles = git.run('git diff --name-only --diff-filter=U')
        .split('\n')
        .filter(Boolean);

    if (conflictedFiles.length !== 1 || conflictedFiles[0] !== 'package.json') {
        return false;
    }

    const developPackageJson = JSON.parse(git.run('git show :2:package.json'));
    const productionPackageJson = JSON.parse(git.run('git show :3:package.json'));

    if (!differsOnlyByVersion(developPackageJson, productionPackageJson)) {
        return false;
    }

    // Mantém o conteúdo de develop. A versão será recalculada após o merge.
    fs.writeFileSync('package.json', JSON.stringify(developPackageJson, null, 2));
    git.run('git add package.json');
    git.run('git commit --no-edit');
    return true;
}

module.exports = async ({ target, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const currentBranch = git.getCurrentBranch();

    if (target === 'homolog' || target === 'production') {
        const baseBranch = target === 'production' ? prodBranch : devBranch;
        const isBeta = target !== 'production';
        const originalBranch = currentBranch;

        git.ensureCleanWorkingDirectory();
        git.checkout(baseBranch);
        git.pull();

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let currentVersion = packageJson.version;

        log.info(`📦 Versão atual: ${currentVersion}`);
        log.info(`🚀 Criando release para ${target}...`);

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
            git.run(`git push -u origin ${releaseBranch}`);

            log.success(`Release ${newVersion} criada!`);
            log.info(`Branch criada: '${releaseBranch}'`);
            log.info(`Exemplo de deploy para esse release: 'git-task deploy ${newVersion}'`);
            git.checkout(originalBranch);
        } catch (error) {
            log.error(`❌ Erro ao criar release: ${error.message}`);
            git.checkout(originalBranch);
            process.exit(1);
        }
        return;
    }

    if (target === 'publish') {
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

            // Cria e envia a tag agora!
            git.run(`git tag -a v${version} -m "🚀 Release ${version}"`);
            git.pushTags();

            // Se for produção, sincroniza develop com main
            if (!isBeta) {
                git.checkout(devBranch);
                git.pull();
                const developPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                try {
                    git.merge(prodBranch); // merge main -> develop
                } catch (mergeError) {
                    if (!resolvePackageJsonVersionConflict()) {
                        throw mergeError;
                    }
                    log.info('Conflito de versão do package.json resolvido automaticamente.');
                }

                const nextDevelopVersion = nextDevelopVersionAfterProduction(
                    version,
                    developPackageJson.version,
                );
                const syncedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                syncedPackageJson.version = nextDevelopVersion;
                fs.writeFileSync('package.json', JSON.stringify(syncedPackageJson, null, 2));
                git.run('git add package.json');
                git.run(`git commit -m "🔖 Ajusta versão de homologação para ${nextDevelopVersion}"`);
                git.push();
            }

            git.checkout(currentBranch);

            log.success(`Release ${version} publicada com sucesso!`);
            log.info(`Branch que foi publicada '${targetBranch}'`);
            log.info(`Tag criada v${version} criada!`);

            if (!isBeta) {
                log.info(`Homolog (${devBranch}) sincronizado com as novidades da produção (${prodBranch}) e com uma nova versão beta!`);
            }

        } catch (error) {
            log.error(`Erro ao publicar release: ${error.message}`);
            git.checkout(currentBranch);
            process.exit(1);
        }
        return;
    }

    if (target === 'finish') {
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
            log.success(`Release ${version} finalizado!`);
        } catch (error) {
            log.error(`Erro ao finalizar release: ${error.message}`);
            process.exit(1);
        }
        return;
    }

    log.error('Ação de release inválida.');
    process.exit(1);
};
