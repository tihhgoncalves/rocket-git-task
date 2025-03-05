const { execSync } = require('child_process');

function getConfig(key) {
    try {
        return execSync(`git config task.${key}`, { encoding: 'utf-8' }).trim();
    } catch (e) {
        return null;  // Retorna null se a config não existir
    }
}

function setConfig(key, value) {
    execSync(`git config task.${key} "${value}"`);
}

function getBranches() {
    return {
        prodBranch: getConfig('prod-branch'),
        devBranch: getConfig('dev-branch')
    };
}

module.exports = {
    getConfig,
    setConfig,
    getBranches
};
