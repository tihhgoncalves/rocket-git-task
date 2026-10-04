const assert = require('assert');
const {
    nextDevelopVersionAfterProduction,
    differsOnlyByVersion,
} = require('../src/utils/version');

assert.strictEqual(
    nextDevelopVersionAfterProduction('0.1.2', '0.1.2-beta.4'),
    '0.1.3-beta.1',
);
assert.strictEqual(
    nextDevelopVersionAfterProduction('0.1.2', '0.2.0-beta.3'),
    '0.2.0-beta.4',
);
assert.strictEqual(
    differsOnlyByVersion(
        { name: 'project', version: '0.1.2-beta.4', scripts: { test: 'node test' } },
        { name: 'project', version: '0.1.2', scripts: { test: 'node test' } },
    ),
    true,
);
assert.strictEqual(
    differsOnlyByVersion(
        { name: 'project', version: '0.1.2-beta.4' },
        { name: 'another-project', version: '0.1.2' },
    ),
    false,
);

console.log('Versionamento de homologação validado.');
