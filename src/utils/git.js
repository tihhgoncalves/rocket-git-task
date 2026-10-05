const { execSync } = require('child_process');
const log = require('./log');

function run(command) {
    return execSync(command, { encoding: 'utf-8' }).trim();
}

function ensureCleanWorkingDirectory() {
    if (!isWorkingDirectoryClean()) {
        log.error('Existem alterações não commitadas. Faça commit ou stash antes de continuar.');
        process.exit(1);
    }
}

function isWorkingDirectoryClean() {
    return !run('git status --porcelain');
}

function branchExists(name) {
    try {
        run(`git show-ref --verify --quiet refs/heads/${name}`);
        return true;
    } catch (error) {
        try {
            run('git remote get-url origin');
        } catch (noRemoteError) {
            return false;
        }

        try {
            run(`git ls-remote --exit-code --heads origin ${name}`);
            return true;
        } catch (remoteError) {
            // O Git retorna 2 quando a consulta foi bem-sucedida, mas a branch não existe.
            if (remoteError.status === 2) {
                return false;
            }
            throw new Error(`Não foi possível verificar a branch remota "${name}".`);
        }
    }
}

function abortMerge() {
    run('git merge --abort');
}

function hasUnmergedPaths() {
    return Boolean(run('git diff --name-only --diff-filter=U'));
}

function rollbackMerge() {
    // O merge --squash não cria MERGE_HEAD; em caso de conflito, --abort falha.
    if (hasUnmergedPaths()) {
        run('git reset --merge');
        return 'reset';
    }

    try {
        abortMerge();
        return 'abort';
    } catch (error) {
        return null;
    }
}

function deleteLocalBranch(name, force = true) {
    run(`git branch ${force ? '-D' : '-d'} ${name}`);
}

function remoteBranchCommit(name) {
    try {
        run('git remote get-url origin');
    } catch (noRemoteError) {
        return null;
    }

    try {
        const result = run(`git ls-remote --exit-code --heads origin ${name}`);
        return result.split(/\s+/)[0];
    } catch (error) {
        if (error.status === 2) {
            return null;
        }
        throw new Error(`Não foi possível verificar a branch remota "${name}".`);
    }
}

function deleteRemoteBranch(name) {
    run(`git push origin --delete ${name}`);
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
    return isAncestor(branch, target);
}

function isAncestor(ancestor, descendant) {
    try {
        run(`git merge-base --is-ancestor ${ancestor} ${descendant}`);
        return true;
    } catch (error) {
        return false;
    }
}

function ensureBranchesExist(prodBranch, devBranch) {
    try { run(`git show-ref --verify --quiet refs/heads/${prodBranch}`); } catch { run(`git checkout -b ${prodBranch}`); }
    try { run(`git show-ref --verify --quiet refs/heads/${devBranch}`); } catch { run(`git checkout -b ${devBranch}`); }
}

module.exports = {
    ensureCleanWorkingDirectory,
    isWorkingDirectoryClean,
    branchExists,
    abortMerge,
    hasUnmergedPaths,
    rollbackMerge,
    deleteLocalBranch,
    remoteBranchCommit,
    deleteRemoteBranch,
    getCurrentBranch,
    checkout,
    pull,
    merge,
    push,
    pushTags,
    createBranch,
    deleteBranch,
    isMerged,
    isAncestor,
    ensureBranchesExist,
    run,
    getConfig,
    checkConfig,
};
