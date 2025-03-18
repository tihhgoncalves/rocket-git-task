const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const fs = require('fs');

module.exports = async ({ target, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const targetBranch = target === 'production' ? prodBranch : devBranch;
    const originalBranch = git.getCurrentBranch();
    const isBeta = target !== 'production';
    // verifica se existem commits não enviados
    git.ensureCleanWorkingDirectory();

    // ✅ Troca para a branch de destino antes de atualizar o package.json
    git.checkout(targetBranch);
    git.pull();

    // Lendo o package.json atual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let currentVersion = packageJson.version;

    log.info(`📦 Versão atual: ${currentVersion}`);
    log.info(`🚀 Criando release para ${target}...`);

    let newVersion;

    try {
        log.info(`🔥 Gerando versão ${isBeta ? 'beta' : 'estável'} manualmente...`);

        // Extrai os números da versão
        const versionMatch = currentVersion.match(/(\d+)\.(\d+)\.(\d+)(-beta\.(\d+))?/);
        if (!versionMatch) {
            throw new Error(`❌ Erro ao interpretar a versão atual: ${currentVersion}`);
        }

        let major = parseInt(versionMatch[1]);
        let minor = parseInt(versionMatch[2]);
        let patch = parseInt(versionMatch[3]);
        let betaNumber = versionMatch[5] ? parseInt(versionMatch[5]) : null;

        // Lógica para incrementar a versão com base no tipo passado
        if (type === 'major') {
            major++;
            minor = 0;
            patch = 0;
            betaNumber = null;
        } else if (type === 'minor') {
            minor++;
            patch = 0;
            betaNumber = null;
        } else if (type === 'patch') {
            patch++;
            betaNumber = null;
        }

        if (isBeta) {
            // Se for beta, incrementamos corretamente
            betaNumber = betaNumber !== null ? betaNumber + 1 : 1;
            newVersion = `${major}.${minor}.${patch}-beta.${betaNumber}`;
        } else {
            // Se for produção, removemos qualquer sufixo beta
            newVersion = `${major}.${minor}.${patch}`;
        }

        // Atualiza o package.json com a nova versão
        packageJson.version = newVersion;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

        log.info(`📌 Nova versão gerada: ${newVersion}`);

        // Faz commit e tag manualmente
        git.run(`git add package.json`);
        git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
        git.run(`git tag -a v${newVersion} -m "🚀 Release ${newVersion}"`);
        git.push();
        git.pushTags();

        log.success(`✅ Release ${newVersion} criada e enviada para o repositório!`);

        // Se for produção, mergeia na develop também
        if (target === 'production') {
            git.checkout(devBranch);
            git.merge(prodBranch);
            git.push();
        }

    } catch (error) {
        log.error(`❌ Erro ao criar release: ${error.message}`);
        process.exit(1);
    }

    // Volta para a branch original
    git.checkout(originalBranch);
    log.success('✅ Release concluída!');
};
