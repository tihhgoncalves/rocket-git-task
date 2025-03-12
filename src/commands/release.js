const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { execSync } = require('child_process');
const fs = require('fs');

function incrementVersion(version, type, isBeta = false) {
    let [major, minor, patch] = version.split('.').map(Number);
    let betaNumber = null;

    if (version.includes('-beta.')) {
        const betaParts = version.split('-beta.');
        version = betaParts[0];
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

    if (isBeta) {
        const nextBetaNumber = betaNumber !== null ? betaNumber + 1 : 1;
        newVersion = `${newVersion}-beta.${nextBetaNumber}`;
    }

    log.info(`📌 Nova versão gerada: ${newVersion}`);
    return newVersion;
}

function getPackageVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
}

module.exports = async ({ target, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const targetBranch = target === 'production' ? prodBranch : devBranch;
    const originalBranch = git.getCurrentBranch();

    git.ensureCleanWorkingDirectory();

    git.checkout(targetBranch);
    git.pull();

    log.info(`🚀 Criando release para ${target}...`);

    const currentVersion = getPackageVersion();
    const newVersion = incrementVersion(currentVersion, type, target !== 'production');

    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    git.run(`git add package.json`);
    git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
    git.push();

    const tagName = `v${newVersion}`;
    git.run(`git tag -a ${tagName} -m "🚀 Release ${tagName}"`);
    git.pushTags();

    log.success(`✅ Release ${tagName} criada e enviada para o repositório!`);

    if (target === 'production') {
        git.checkout(devBranch);
        git.merge(prodBranch);
        git.push();
    }

    git.checkout(originalBranch);
    log.success('✅ Release concluída!');
};
