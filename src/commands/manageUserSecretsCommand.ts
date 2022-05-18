import { FileUtilities, TerminalUtilities } from '../utilities';
import { BaseFileCommand } from '.';
import * as os from 'os';
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

        const secretsFilePath = this.getSecretsFilePath(userSecretsId);
        await this.openSecretsFileWithExponentialBackoff(secretsFilePath);
    }

    private async readUserSecretsId(csprojPath: string): Promise<string> {
        return await FileUtilities.readUserSecretsId(csprojPath);
    }

    private initializeUserSecrets(csprojPath: string) {
        TerminalUtilities.executeCommand(`dotnet user-secrets init --project ${csprojPath}`);
        TerminalUtilities.executeCommand(`dotnet user-secrets clear --project ${csprojPath}`); // This creates the file after initialization
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

    private getSecretsFilePath(userSecretsId: string): string {
        const isWindows = this.isWindows();
        if (isWindows) {
            const baseFolder = process.env.APPDATA ?? '';
            const secretsFilePath = `Microsoft\\UserSecrets\\${userSecretsId}\\secrets.json`;
            return path.resolve(baseFolder, secretsFilePath);
        }
        else {
            const baseFolder = os.homedir();
            const secretsFilePath = `.microsoft/usersecrets/${userSecretsId}/secrets.json`;
            return path.resolve(baseFolder, secretsFilePath);
        }
    }

    private isWindows(): boolean {
        const platform = os.platform();
        const isWindows = platform === 'win32';

        return isWindows;
    }

    private async openSecretsFileWithExponentialBackoff(secretsFilePath: string): Promise<void> {
        const waitTime = 250;
        for (let i = 0; i < 7; i++) {
            await this.waitForMilliseconds(i * waitTime);
            if (FileUtilities.pathExists(secretsFilePath)) {
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