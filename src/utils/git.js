const { execSync } = require('child_process');
const log = require('./log');

function run(command) {
    return execSync(command, { encoding: 'utf-8' }).trim();
}

function ensureCleanWorkingDirectory() {
    if (run('git status --porcelain')) {
        log.error('Existem alterações não commitadas. Faça commit ou stash antes de continuar.');
        process.exit(1);
    }
}

function getCurrentBranch() {
    return run('git rev-parse --abbrev-ref HEAD');
}

function getConfig(key) {
    try {
        return execSync(`git config --get task.${key}`, { encoding: 'utf-8' }).trim();
    } catch (e) {
        return null;
    }
}

function checkConfig() {
    const devBranch = getConfig('dev-branch');
    const prodBranch = getConfig('prod-branch');

    if (!devBranch || !prodBranch) {
        console.log('\n⚠️  Configuração do Rocket Git Task não encontrada.');
        console.log('Por favor, execute: git-task init\n');
        process.exit(1);
    }
}

function checkout(branch) {
    run(`git checkout ${branch}`);
}

function pull() {
    run('git pull');
}

function merge(branch) {
    run(`git merge --no-ff --no-edit ${branch}`);
}

function push() {
    run('git push');
}

function pushTags() {
    run('git push --tags');
}

function createBranch(name) {
    run(`git checkout -b ${name}`);
}

function deleteBranch(name, force = false) {
    run(`git branch ${force ? '-D' : '-d'} ${name}`);
    try {
        run(`git push origin --delete ${name}`);
    } catch (e) {
        log.warn(`Falha ao remover branch remota: ${name} (pode já ter sido deletada).`);
    }
}

function isMerged(branch, target) {
    const mergedBranches = run(`git branch --merged ${target}`);
    return mergedBranches.includes(branch);
}

function ensureBranchesExist(prodBranch, devBranch) {
    try { run(`git show-ref --verify --quiet refs/heads/${prodBranch}`); } catch { run(`git checkout -b ${prodBranch}`); }
    try { run(`git show-ref --verify --quiet refs/heads/${devBranch}`); } catch { run(`git checkout -b ${devBranch}`); }
}

module.exports = {
    ensureCleanWorkingDirectory,
    getCurrentBranch,
    checkout,
    pull,
    merge,
    push,
    pushTags,
    createBranch,
    deleteBranch,
    isMerged,
    ensureBranchesExist,
    run,
    getConfig,
    checkConfig,
};
