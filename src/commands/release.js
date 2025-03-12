const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { execSync } = require('child_process');
const fs = require('fs');

// Função para incrementar a versão
function incrementVersion(version, type, isBeta = false) {
    const [major, minor, patch] = version.split('.').map(Number);

    let newVersion;
    if (type === 'major') {
        newVersion = `${major + 1}.0.0`;
    } else if (type === 'minor') {
        newVersion = `${major}.${minor + 1}.0`;
    } else {
        newVersion = `${major}.${minor}.${patch + 1}`;
    }

    // Se for beta (homologação), adiciona "-beta.1" e não soma betas antigos
    if (isBeta) {
        const existingBetaTags = execSync(`git tag -l "v${newVersion}-beta.*"`)
            .toString()
            .trim()
            .split('\n')
            .filter(tag => tag.startsWith(`v${newVersion}-beta.`));

        const betaCount = existingBetaTags.length + 1; // Começa do 1
        newVersion = `${newVersion}-beta.${betaCount}`;
    }

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

    git.ensureCleanWorkingDirectory();

    // ✅ Troca para a branch de destino antes de atualizar o package.json
    git.checkout(targetBranch);
    git.pull();

    log.info(`Criando release para ${target}...`);

    // Obtém a versão atual e gera a nova versão automaticamente
    const currentVersion = getPackageVersion();
    log.info(`📦 Versão atual: ${currentVersion}`);
    const newVersion = incrementVersion(currentVersion, type, target !== 'production');

    // ✅ Atualiza o package.json na branch de destino
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    log.info(`📌 Nova versão gerada: ${newVersion}`);

    // ✅ Faz commit da versão
    git.run(`git add package.json`);
    git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
    git.push();

    // ✅ Cria uma nova tag e envia para o repositório
    const tagName = `v${newVersion}`;
    git.run(`git tag -a ${tagName} -m "🚀 Release ${tagName}"`);
    git.pushTags();

    log.success(`Release ${tagName} criada e enviada para o repositório!`);

    // ✅ Se for produção, mergeia na develop também
    if (target === 'production') {
        git.checkout(devBranch);
        git.merge(prodBranch);
        git.push();
    }

    // ✅ Volta para a branch original
    git.checkout(originalBranch);
    log.success('Release concluída!');
};
