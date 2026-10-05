const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

function parseVersion(version) {
    const match = version.match(VERSION_PATTERN);
    if (!match) {
        throw new Error(`Erro ao interpretar a versão: ${version}`);
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        beta: match[4] === undefined ? null : Number(match[4]),
    };
}

function compareBaseVersions(left, right) {
    for (const part of ['major', 'minor', 'patch']) {
        if (left[part] !== right[part]) {
            return left[part] - right[part];
        }
    }
    return 0;
}

function formatBetaVersion({ major, minor, patch, beta }) {
    return `${major}.${minor}.${patch}-beta.${beta}`;
}

/**
 * Calcula a versão de homologação após uma publicação em produção.
 *
 * Uma beta da mesma versão (ou anterior) à que acabou de ser publicada não
 * pode continuar apontando para a release já estável; ela passa para o patch
 * seguinte. Uma beta de uma versão futura continua sua própria sequência.
 */
function nextDevelopVersionAfterProduction(productionVersion, developVersion) {
    const production = parseVersion(productionVersion);
    const develop = parseVersion(developVersion);

    if (compareBaseVersions(develop, production) > 0) {
        return formatBetaVersion({ ...develop, beta: (develop.beta || 0) + 1 });
    }

    return formatBetaVersion({
        major: production.major,
        minor: production.minor,
        patch: production.patch + 1,
        beta: 1,
    });
}

function differsOnlyByVersion(firstPackageJson, secondPackageJson) {
    const { version: firstVersion, ...firstWithoutVersion } = firstPackageJson;
    const { version: secondVersion, ...secondWithoutVersion } = secondPackageJson;

    return firstVersion !== secondVersion
        && JSON.stringify(firstWithoutVersion) === JSON.stringify(secondWithoutVersion);
}

module.exports = { nextDevelopVersionAfterProduction, differsOnlyByVersion };
