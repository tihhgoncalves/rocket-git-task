const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
    nextDevelopVersionAfterProduction,
    differsOnlyByVersion,
} = require('../src/utils/version');
const git = require('../src/utils/git');
const { nextHomologVersion, restoreFileContents } = require('../src/utils/release-safety');

assert.strictEqual(
    nextDevelopVersionAfterProduction('0.1.2', '0.1.2-beta.4'),
    '0.1.3-beta.1',
);
assert.strictEqual(nextHomologVersion('0.0.3-beta.5'), '0.0.3-beta.6');

const temporaryPackageJson = path.join(os.tmpdir(), `rocket-git-task-${process.pid}-package.json`);
fs.writeFileSync(temporaryPackageJson, '{"version":"0.0.3-beta.6"}');
restoreFileContents(temporaryPackageJson, '{"version":"0.0.3-beta.5"}');
assert.strictEqual(fs.readFileSync(temporaryPackageJson, 'utf8'), '{"version":"0.0.3-beta.5"}');
fs.unlinkSync(temporaryPackageJson);

const originalDirectory = process.cwd();
const temporaryRepository = fs.mkdtempSync(path.join(os.tmpdir(), 'rocket-git-task-git-'));
const temporaryRemote = fs.mkdtempSync(path.join(os.tmpdir(), 'rocket-git-task-remote-'));
try {
    process.chdir(temporaryRepository);
    execFileSync('git', ['init', '-q']);
    execFileSync('git', ['config', 'user.email', 'test@example.com']);
    execFileSync('git', ['config', 'user.name', 'Rocket Git Task Test']);
    fs.writeFileSync('README.md', 'test');
    execFileSync('git', ['add', 'README.md']);
    execFileSync('git', ['commit', '-qm', 'init']);
    execFileSync('git', ['branch', 'release/0.0.3-beta.6']);
    assert.strictEqual(git.branchExists('release/0.0.3-beta.6'), true);
    execFileSync('git', ['init', '--bare', '-q', temporaryRemote]);
    execFileSync('git', ['remote', 'add', 'origin', temporaryRemote]);
    execFileSync('git', ['push', '-q', 'origin', 'release/0.0.3-beta.6']);
    execFileSync('git', ['branch', '-D', 'release/0.0.3-beta.6']);
    assert.strictEqual(git.branchExists('release/0.0.3-beta.6'), true);
    assert.strictEqual(git.isWorkingDirectoryClean(), true);
    fs.writeFileSync('README.md', 'dirty');
    assert.strictEqual(git.isWorkingDirectoryClean(), false);
} finally {
    process.chdir(originalDirectory);
    fs.rmSync(temporaryRepository, { recursive: true, force: true });
    fs.rmSync(temporaryRemote, { recursive: true, force: true });
}
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
