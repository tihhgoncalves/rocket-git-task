const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const readline = require('readline');
const { getConfig, setConfig } = require('../config');
const git = require('../utils/git');
const log = require('../utils/log');

async function askBackupDirectory() {
    // Pega o último diretório usado
    const lastBackupDir = getConfig('backup-dir');
    const defaultDir = lastBackupDir || 'C:\\Users\\' + require('os').userInfo().username + '\\Desktop';
    
    if (lastBackupDir) {
        log.info(`Último diretório usado: ${lastBackupDir}`);
        log.info('Deixe em branco para usar o mesmo diretório ou digite um novo caminho.');
    }
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(`Qual diretório para salvar o backup? (${defaultDir}): `, (answer) => {
            rl.close();
            resolve(answer.trim() || defaultDir);
        });
    });
}

function getCurrentTaskName() {
    const currentBranch = git.getCurrentBranch();
    
    // Verifica se está em uma branch de task
    if (!currentBranch.startsWith('task/')) {
        log.error('Você deve estar em uma branch de task para criar um backup!');
        log.info('Use: git-task create <nome-da-task> para criar uma nova task.');
        process.exit(1);
    }
    
    // Extrai o nome da task da branch (task/nome-da-task -> nome-da-task)
    return currentBranch.replace('task/', '');
}

async function createZipBackup(taskName, backupDir) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const zipFileName = `task-${taskName}-${timestamp}.zip`;
        const zipPath = path.join(backupDir, zipFileName);
        
        // Cria o diretório se não existir
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        
        output.on('close', () => {
            log.success(`Backup criado com sucesso!`);
            log.info(`Arquivo: ${zipPath}`);
            log.info(`Tamanho: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            resolve(zipPath);
        });
        
        output.on('error', (err) => {
            log.error(`Erro ao criar o arquivo ZIP: ${err.message}`);
            reject(err);
        });
        
        archive.on('error', (err) => {
            log.error(`Erro no archiver: ${err.message}`);
            reject(err);
        });
        
        archive.pipe(output);
        
        // Adiciona todos os arquivos do repositório (exceto .git)
        // Vamos usar o git para listar apenas os arquivos versionados
        try {
            const gitFiles = git.run('git ls-files');
            const files = gitFiles.split('\n').filter(file => file.trim() !== '');
            
            files.forEach(file => {
                if (fs.existsSync(file)) {
                    archive.file(file, { name: file });
                }
            });
            
            // Adiciona também arquivos não versionados mas importantes (package-lock.json, etc.)
            const additionalFiles = [
                'package-lock.json',
                'yarn.lock',
                'pnpm-lock.yaml',
                '.env.example',
                'README.md'
            ];
            
            additionalFiles.forEach(file => {
                if (fs.existsSync(file) && !files.includes(file)) {
                    archive.file(file, { name: file });
                }
            });
            
            archive.finalize();
        } catch (error) {
            log.error(`Erro ao listar arquivos do git: ${error.message}`);
            reject(error);
        }
    });
}

module.exports = async () => {
    // Verifica se as configurações existem
    git.checkConfig();
    
    // Verifica se está em uma task
    const taskName = getCurrentTaskName();
    
    log.info(`Criando backup da task: ${taskName}`);
    
    // Pergunta o diretório para salvar
    const backupDir = await askBackupDirectory();
    
    // Salva o diretório escolhido para próximas vezes
    setConfig('backup-dir', backupDir);
    
    try {
        await createZipBackup(taskName, backupDir);
    } catch (error) {
        log.error(`Falha ao criar backup: ${error.message}`);
        process.exit(1);
    }
};