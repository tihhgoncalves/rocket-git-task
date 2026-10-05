const fs = require('fs');

function nextHomologVersion(currentVersion) {
    const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(-beta\.(\d+))?$/);
    if (!versionMatch) {
        throw new Error(`Erro ao interpretar a versão atual: ${currentVersion}`);
    }

    const major = Number(versionMatch[1]);
    const minor = Number(versionMatch[2]);
    let patch = Number(versionMatch[3]);
    const betaNumber = versionMatch[5] === undefined ? null : Number(versionMatch[5]);

    return betaNumber === null
        ? `${major}.${minor}.${patch + 1}-beta.1`
        : `${major}.${minor}.${patch}-beta.${betaNumber + 1}`;
}

function restoreFileContents(path, originalContents) {
    if (fs.readFileSync(path, 'utf8') !== originalContents) {
        fs.writeFileSync(path, originalContents);
    }
}

module.exports = { nextHomologVersion, restoreFileContents };
