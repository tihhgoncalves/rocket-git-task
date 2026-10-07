function deploymentCommitMessage(taskBranch, releaseBranch, snapshot) {
    return `🚀 Deploy da task '${taskBranch}' para ${releaseBranch}\n\nGit-Task-Source: ${taskBranch}\nGit-Task-Snapshot: ${snapshot}`;
}

function parseDeploymentSnapshots(messages) {
    const snapshots = [];
    const pattern = /Git-Task-Source: (task\/[^\r\n]+)\r?\nGit-Task-Snapshot: ([0-9a-f]{7,40})/g;
    let match;

    while ((match = pattern.exec(messages))) {
        snapshots.push({ taskBranch: match[1], snapshot: match[2] });
    }

    return snapshots;
}

function snapshotForTask(messages, taskBranch) {
    return parseDeploymentSnapshots(messages).find(({ taskBranch: source }) => source === taskBranch)?.snapshot || null;
}

module.exports = { deploymentCommitMessage, parseDeploymentSnapshots, snapshotForTask };
