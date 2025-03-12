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

    // Se for beta (homologação), adiciona o número incremental
    if (isBeta) {
        // Conta quantas versões beta já existem
        const betaCount = execSync(`git tag -l "v${newVersion}-beta.*"`)
            .toString()
            .trim()
            .split('\n').length;

        newVersion = `${newVersion}-beta.${betaCount + 1}`;
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
    const originalBranch = git.getCurrentBranch();
    const targetBranch = target === 'production' ? prodBranch : devBranch;

    // verifica se existem commits não enviados
    git.ensureCleanWorkingDirectory();

    // Carrega o branch de destino e faz um pull
    git.checkout(targetBranch);
    git.pull();

    log.info(`Criando release para ${target}...`);

    // Obtém a versão atual e gera a nova versão automaticamente
    const currentVersion = getPackageVersion();
    const newVersion = incrementVersion(currentVersion, type, target !== 'production');

    // Atualiza o package.json com a nova versão
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    log.info(`📌 Nova versão gerada: ${newVersion}`);

    // Cria uma nova tag e envia para o repositório
    const tagName = `v${newVersion}`;
    git.run(`git tag -a ${tagName} -m "🚀 Release ${tagName}"`);
    git.push();
    git.pushTags();

    log.success(`Release ${tagName} criada e enviada para o repositório!`);

    // Se for produção, mergeia na develop também
    if (target === 'production') {
        git.checkout(devBranch);
        git.merge(prodBranch);
        git.push();
    }

    git.checkout(originalBranch);
    log.success('Release concluída!');
};
