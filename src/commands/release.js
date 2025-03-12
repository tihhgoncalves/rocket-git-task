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

    git.ensureCleanWorkingDirectory();

    git.checkout(targetBranch);
    git.pull();

    // Obtém a versão atual antes do release
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;

    log.info(`📦 Versão atual: ${currentVersion}`);
    log.info(`🚀 Criando release para ${target}...`);

    // Define o comando correto para incrementar a versão
    let versionCommand = `npm version ${type}`;
    if (isBeta) {
        versionCommand = `npm version ${type} --preid=beta`;
    }

    try {
        // Executa o comando para incrementar a versão automaticamente
        execSync(versionCommand, { stdio: 'inherit' });

        // Obtém a nova versão gerada após a atualização do package.json
        const updatedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const newVersion = updatedPackageJson.version;

        log.info(`📌 Nova versão gerada: ${newVersion}`);

        // Faz push da nova versão e das tags
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
