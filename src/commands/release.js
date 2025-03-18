const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { execSync } = require('child_process');
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

    // Obtém a versão atual antes do release
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;

    log.info(`📦 Versão atual: ${currentVersion}`);
    log.info(`🚀 Criando release para ${target}...`);

    try {
        let newVersion;

        if (isBeta) {
            // Se for beta, garantimos que ele incremente corretamente
            log.info('🔥 Gerando versão beta...');
            execSync(`npm version ${type} --preid=beta --no-git-tag-version`, { stdio: 'inherit' });
        } else {
            // Para produção, seguimos o fluxo normal do npm version
            log.info('🔥 Gerando versão de produção...');
            execSync(`npm version ${type} --no-git-tag-version`, { stdio: 'inherit' });
        }

        // Lendo novamente o package.json para garantir que a nova versão seja capturada
        const updatedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        newVersion = updatedPackageJson.version;

        log.info(`📌 Nova versão gerada: ${newVersion}`);

        // Faz commit e tag manualmente (pois removemos `git-tag-version` do npm version)
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
