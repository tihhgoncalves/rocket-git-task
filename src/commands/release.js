const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const fs = require('fs');

module.exports = async ({ target, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const isProduction = target === 'production';
    const baseBranch = isProduction ? prodBranch : devBranch;

    git.ensureCleanWorkingDirectory();

    // Atualiza a branch base
    git.checkout(baseBranch);
    git.pull();

    // Lê o package.json atual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let currentVersion = packageJson.version;

    log.info(`📦 Versão atual: ${currentVersion}`);
    log.info(`🚀 Criando release para ${target}...`);

    let newVersion;

    try {
        // Regex para capturar versão
        const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(-beta\.(\d+))?$/);
        if (!versionMatch) {
            throw new Error(`❌ Erro ao interpretar a versão atual: ${currentVersion}`);
        }

        let major = parseInt(versionMatch[1]) || 0;
        let minor = parseInt(versionMatch[2]) || 0;
        let patch = parseInt(versionMatch[3]) || 0;
        let betaNumber = versionMatch[5] ? parseInt(versionMatch[5]) : null;

        if (!isProduction) {
            // Homologação (beta)
            if (betaNumber !== null) {
                betaNumber++;
            } else {
                if (type === 'major') {
                    major++;
                    minor = 0;
                    patch = 0;
                } else if (type === 'minor') {
                    minor++;
                    patch = 0;
                } else if (type === 'patch') {
                    patch++;
                }
                betaNumber = 1;
            }
            newVersion = `${major}.${minor}.${patch}-beta.${betaNumber}`;
        } else {
            // Produção
            if (type === 'major') {
                major++;
                minor = 0;
                patch = 0;
            } else if (type === 'minor') {
                minor++;
                patch = 0;
            } else if (type === 'patch') {
                patch++;
            }
            newVersion = `${major}.${minor}.${patch}`;
        }

        // Cria a branch de release
        const releaseBranch = `release/${newVersion}`;
        git.run(`git checkout -b ${releaseBranch} ${baseBranch}`);

        // Atualiza o package.json
        packageJson.version = newVersion;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

        log.info(`📌 Nova versão gerada: ${newVersion}`);

        // Commit e tag na branch de release
        git.run(`git add package.json`);
        git.run(`git commit -m "🔖 Bump versão para ${newVersion}"`);
        git.run(`git tag -a v${newVersion} -m "🚀 Release ${newVersion}"`);
        git.push(releaseBranch);
        git.pushTags();

        log.success(`✅ Branch de release "${releaseBranch}" criada e enviada para o repositório!`);
        log.info(`Finalize o release com: git-task release publish`);
    } catch (error) {
        log.error(`❌ Erro ao criar release: ${error.message}`);
        process.exit(1);
    }
};
