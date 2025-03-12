const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { execSync } = require('child_process');
const fs = require('fs');

// Função para incrementar a versão
function incrementVersion(version, type, isBeta = false) {
    let [major, minor, patch] = version.split('.').map(Number);
    let betaNumber = null;

    // Se já for um beta, extraímos o número do beta atual
    if (version.includes('-beta.')) {
        const betaParts = version.split('-beta.');
        version = betaParts[0]; // Remove o beta para processar a versão normal
        betaNumber = parseInt(betaParts[1]) || 1;
    }

    let newVersion;
    if (type === 'major') {
        newVersion = `${major + 1}.0.0`;
    } else if (type === 'minor') {
        newVersion = `${major}.${minor + 1}.0`;
    } else {
        newVersion = `${major}.${minor}.${patch + 1}`;
    }

    log.info(`📦 Versão atual: ${version}`);

    // Se for beta (homologação), usa o contador do `package.json`
    if (isBeta) {
        const nextBetaNumber = betaNumber !== null ? betaNumber + 1 : 1;
        newVersion = `${newVersion}-beta.${nextBetaNumber}`;
    }

    log.info(`📌 Nova versão gerada: ${newVersion}`);
    return newVersion;
}

// Obtém a versão atual do package.json
function getPackageVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
}

module.exports = async ({ target, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const targetBranch = target === 'production' ? prodBranch : devBranch;
    const originalBranch = git.getCurrentBranch();

    // verifica se existem commits não enviados
    git.ensureCleanWorkingDirectory();

    // ✅ Troca para a branch de destino antes de atualizar o package.json
    git.checkout(targetBranch);
    git.pull();

    log.info(`🚀 Criando release para ${target}...`);

    // Obtém a versão atual e gera a nova versão automaticamente
    const currentVersion = getPackageVersion();
    const newVersion = incrementVersion(currentVersion, type, target !== 'production');

    // ✅ Atualiza o package.json na branch de destino
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // ✅ Faz commit da versão
    git.run(`git add package.json`);
    git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
    git.push();

    // ✅ Cria uma nova tag e envia para o repositório
    const tagName = `v${newVersion}`;
    git.run(`git tag -a ${tagName} -m "🚀 Release ${tagName}"`);
    git.pushTags();

    log.success(`✅ Release ${tagName} criada e enviada para o repositório!`);

    // ✅ Se for produção, mergeia na develop também
    if (target === 'production') {
        git.checkout(devBranch);
        git.merge(prodBranch);
        git.push();
    }

    // ✅ Volta para a branch original
    git.checkout(originalBranch);
    log.success('✅ Release concluída!');
};
