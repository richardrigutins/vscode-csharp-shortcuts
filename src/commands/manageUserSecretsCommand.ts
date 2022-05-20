import { FileUtilities, OsUtilities, TerminalUtilities } from '../utilities';
import { BaseFileCommand } from '.';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Runs the command to manage user secrets on a csproj file.
 */
export class ManageUserSecretsCommand implements BaseFileCommand {
    private readonly backoffRetries = 8;
    private readonly backoffDelay = 250;

    async run(csprojPath: string) {
        let userSecretsId: string | undefined = await this.readUserSecretsId(csprojPath);
        if (!userSecretsId) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Initializing user secrets...'
            }, async () => {
                this.initializeUserSecrets(csprojPath);
                userSecretsId = await this.readUserSecretsIdWithExponentialBackoff(csprojPath);
                if (!userSecretsId) {
                    throw new Error(`Failed to read user secrets id from ${csprojPath}.`);
                }
            });
        }

        const secretsFilePath = this.getSecretsFilePath(userSecretsId);
        if (!this.fileExists(secretsFilePath)) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating secrets file...'
            }, async () => {
                // The user secrets id might have been initialized on another machine
                // and the secrets file still needs to be created locally.
                this.createEmptySecretsFile(csprojPath);

                if (!(await this.checkFileExistenceWithExponentialBackoff(secretsFilePath))) {
                    throw new Error(`Failed to find secrets file ${secretsFilePath}.`);
                }
            });
        }

        await this.openSecretsFile(secretsFilePath);
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

    private async readUserSecretsIdWithExponentialBackoff(csprojPath: string): Promise<string | undefined> {
        for (let i = 0; i < this.backoffRetries; i++) {
            await this.waitForMilliseconds(i * this.backoffDelay);
            const userSecretsId = await this.readUserSecretsId(csprojPath);
            if (userSecretsId) {
                return userSecretsId;
            }
        }

        return undefined;
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

    private async checkFileExistenceWithExponentialBackoff(secretsFilePath: string): Promise<boolean> {
        for (let i = 0; i < this.backoffRetries; i++) {
            await this.waitForMilliseconds(i * this.backoffDelay);
            if (this.fileExists(secretsFilePath)) {
                return true;
            }
        }

        return false;
    }

    private async openSecretsFile(secretsFilePath: string): Promise<void> {
        await vscode.workspace.openTextDocument(secretsFilePath).then((doc: vscode.TextDocument) => {
            vscode.window.showTextDocument(doc, 1, false);
        });
    }
}
