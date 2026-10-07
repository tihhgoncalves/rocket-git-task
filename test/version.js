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
const {
    deploymentCommitMessage,
    parseDeploymentSnapshots,
    snapshotForTask,
} = require('../src/utils/task-deployment');

assert.strictEqual(
    nextDevelopVersionAfterProduction('0.1.2', '0.1.2-beta.4'),
    '0.1.3-beta.1',
);
assert.strictEqual(nextHomologVersion('0.0.3-beta.5'), '0.0.3-beta.6');
const deploymentMessage = deploymentCommitMessage('task/delta', 'release/0.0.4-beta.1', 'abcdef1');
assert.deepStrictEqual(parseDeploymentSnapshots(deploymentMessage), [{ taskBranch: 'task/delta', snapshot: 'abcdef1' }]);
assert.strictEqual(snapshotForTask(deploymentMessage, 'task/delta'), 'abcdef1');

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

    execFileSync('git', ['checkout', '-q', '-b', 'release/0.0.4-beta.1']);
    fs.writeFileSync('release.txt', 'release');
    execFileSync('git', ['add', 'release.txt']);
    execFileSync('git', ['commit', '-qm', 'release']);
    execFileSync('git', ['push', '-q', '-u', 'origin', 'release/0.0.4-beta.1']);
    fs.writeFileSync('release.txt', 'release ahead');
    execFileSync('git', ['commit', '-am', 'release ahead', '-q']);
    const localReleaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const remoteReleaseCommit = git.remoteBranchCommit('release/0.0.4-beta.1');
    assert.notStrictEqual(localReleaseCommit, remoteReleaseCommit);
    execFileSync('git', ['checkout', '-q', '-']);
    execFileSync('git', ['merge', '--no-ff', '--no-edit', '-q', 'release/0.0.4-beta.1']);
    assert.strictEqual(git.isAncestor('release/0.0.4-beta.1', 'HEAD'), true);
    assert.strictEqual(git.isAncestor(remoteReleaseCommit, 'HEAD'), true);
    git.deleteLocalBranch('release/0.0.4-beta.1', true);
    assert.strictEqual(git.branchExists('release/0.0.4-beta.1'), true);

    execFileSync('git', ['checkout', '-q', '-b', 'task/conflicting-change']);
    fs.writeFileSync('conflict.txt', 'task');
    execFileSync('git', ['add', 'conflict.txt']);
    execFileSync('git', ['commit', '-qm', 'task conflict']);
    const taskConflictCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    execFileSync('git', ['checkout', '-q', '-']);
    fs.writeFileSync('conflict.txt', 'develop');
    execFileSync('git', ['add', 'conflict.txt']);
    execFileSync('git', ['commit', '-qm', 'develop conflict']);
    assert.throws(() => execFileSync('git', ['merge', '--squash', 'task/conflicting-change']));
    assert.strictEqual(git.hasUnmergedPaths(), true);
    assert.strictEqual(git.rollbackMerge(), 'reset');
    assert.strictEqual(git.hasUnmergedPaths(), false);
    assert.strictEqual(git.isWorkingDirectoryClean(), true);
    execFileSync('git', ['checkout', '-q', 'task/conflicting-change']);
    assert.strictEqual(git.getCurrentBranch(), 'task/conflicting-change');
    assert.strictEqual(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), taskConflictCommit);
    execFileSync('git', ['checkout', '-q', '-']);

    execFileSync('git', ['checkout', '-q', '-b', 'task/delta']);
    fs.writeFileSync('historical-change.txt', 'already deployed');
    execFileSync('git', ['add', 'historical-change.txt']);
    execFileSync('git', ['commit', '-qm', 'historical task change']);
    const deployedSnapshot = git.getCommitHash('HEAD');
    fs.writeFileSync('new-delta.txt', 'deploy only this change');
    execFileSync('git', ['add', 'new-delta.txt']);
    execFileSync('git', ['commit', '-qm', 'new task change']);
    git.setTaskDeploymentSnapshot('task/delta', deployedSnapshot);
    assert.strictEqual(git.getTaskDeploymentSnapshot('task/delta'), deployedSnapshot);
    execFileSync('git', ['checkout', '-q', '-']);
    git.applyCommitDelta(deployedSnapshot, 'task/delta');
    assert.strictEqual(fs.existsSync('historical-change.txt'), false);
    assert.strictEqual(fs.readFileSync('new-delta.txt', 'utf8'), 'deploy only this change');
    execFileSync('git', ['reset', '--hard', '-q']);

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
