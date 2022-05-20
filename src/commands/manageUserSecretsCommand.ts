import { FileUtilities, OsUtilities, TerminalUtilities } from '../utilities';
import { BaseFileCommand } from '.';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Runs the command to manage user secrets on a csproj file.
 */
export class ManageUserSecretsCommand implements BaseFileCommand {
    async run(csprojPath: string) {
        let userSecretsId = await this.readUserSecretsId(csprojPath);
        if (!userSecretsId) {
            this.initializeUserSecrets(csprojPath);
            userSecretsId = await this.readUserSecretsIdWithExponentialBackoff(csprojPath);
        }

        // The user secrets id might have been initialized on another machine
        // and the secrets file still needs to be created locally.
        if (!this.fileExists(this.getSecretsFilePath(userSecretsId))) {
            this.createEmptySecretsFile(csprojPath);
        }

        const secretsFilePath = this.getSecretsFilePath(userSecretsId);
        await this.openSecretsFileWithExponentialBackoff(secretsFilePath);
    }

    private async readUserSecretsId(csprojPath: string): Promise<string> {
        return await FileUtilities.readUserSecretsId(csprojPath);
    }

    private initializeUserSecrets(csprojPath: string) {
        TerminalUtilities.executeCommand(`dotnet user-secrets init --project ${csprojPath}`);
    }

    private createEmptySecretsFile(csprojPath: string) {
        TerminalUtilities.executeCommand(`dotnet user-secrets clear --project ${csprojPath}`);
    }

    private async readUserSecretsIdWithExponentialBackoff(csprojPath: string): Promise<string> {
        const waitTime = 250;
        for (let i = 0; i < 7; i++) {
            await this.waitForMilliseconds(i * waitTime);
            const userSecretsId = await this.readUserSecretsId(csprojPath);
            if (userSecretsId) {
                return userSecretsId;
            }
        }

        throw new Error(`Failed to read user secrets id from ${csprojPath}.`);
    }

    private async waitForMilliseconds(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    private fileExists(filePath: string): boolean {
        return FileUtilities.pathExists(filePath);
    }

    private getSecretsFilePath(userSecretsId: string): string {
        const isWindows = this.isWindows();
        if (isWindows) {
            const baseFolder = OsUtilities.getAppDataFolder();
            const secretsFilePath = `Microsoft\\UserSecrets\\${userSecretsId}\\secrets.json`;
            return path.resolve(baseFolder, secretsFilePath);
        }
        else {
            const baseFolder = OsUtilities.getHomeDirectory();
            const secretsFilePath = `.microsoft/usersecrets/${userSecretsId}/secrets.json`;
            return path.resolve(baseFolder, secretsFilePath);
        }
    }

    private isWindows(): boolean {
        return OsUtilities.isWindows();
    }

    private async openSecretsFileWithExponentialBackoff(secretsFilePath: string): Promise<void> {
        const waitTime = 250;
        for (let i = 0; i < 7; i++) {
            await this.waitForMilliseconds(i * waitTime);
            if (this.fileExists(secretsFilePath)) {
                return await this.openSecretsFile(secretsFilePath);
            }
        }

        throw new Error(`Failed to open secrets file ${secretsFilePath}.`);
    }

    private async openSecretsFile(secretsFilePath: string): Promise<void> {
        await vscode.workspace.openTextDocument(secretsFilePath).then((doc: vscode.TextDocument) => {
            vscode.window.showTextDocument(doc, 1, false);
        });
    }
}
