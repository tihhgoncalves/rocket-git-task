const { getBranches } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');
const { execSync } = require('child_process');

module.exports = async ({ target, type = 'patch' }) => {
    const { prodBranch, devBranch } = getBranches();
    const targetBranch = target === 'production' ? prodBranch : devBranch;
    const originalBranch = git.getCurrentBranch();
    const isBeta = target !== 'production';

    git.ensureCleanWorkingDirectory();

    git.checkout(targetBranch);
    git.pull();

    log.info(`🚀 Criando release para ${target}...`);

    // Define o comando correto para incrementar a versão
    let versionCommand = `npm version ${type}`;
    
    if (isBeta) {
        versionCommand = `npm version ${type} --preid=beta`;
    }

    // Executa o comando para incrementar a versão automaticamente
    const newVersion = execSync(versionCommand, { stdio: 'inherit' }).toString().trim();

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

    // Volta para a branch original
    git.checkout(originalBranch);
    log.success('✅ Release concluída!');
};
