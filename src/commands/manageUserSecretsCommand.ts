import * as vscode from 'vscode';
import { FileUtilities, TerminalUtilities } from '../utilities';
import { BaseFileCommand } from '.';
var os = require('os');

/**
 * Runs the command to manage user secrets on a csproj file.
 */
export class ManageUserSecretsCommand implements BaseFileCommand {
    private readonly windowsSecretsPath = '%APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json';
    private readonly unixSecretsPath = '~/.microsoft/usersecrets/<user_secrets_id>/secrets.json';

    async run(csprojPath: string) {
        let userSecretsId = await this.readUserSecretsId(csprojPath);
        if (!userSecretsId) {
            this.initializeUserSecrets(csprojPath);
            userSecretsId = await this.readUserSecretsIdWithExponentialBackoff(csprojPath);
        }

        const secretsFilePath = this.getSecretsFilePath(userSecretsId);
        this.openSecretsFile(secretsFilePath);
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
        for (let i = 1; i < 7; i++) {
            await new Promise(resolve => setTimeout(resolve, i * waitTime));

            const userSecretsId = await this.readUserSecretsId(csprojPath);
            if (userSecretsId) {
                return userSecretsId;
            }
        }

        throw new Error(`Could not read user secrets id from ${csprojPath}`);
    }

    private getSecretsFilePath(userSecretsId: string): string {
        const isWindows = this.isWindows();
        if (isWindows) {
            return this.windowsSecretsPath.replace('<user_secrets_id>', userSecretsId);
        }
        else {
            return this.unixSecretsPath.replace('<user_secrets_id>', userSecretsId).replace('~', os.homedir());
        }
    }

    private isWindows(): boolean {
        const platform = os.platform();
        const isWindows = platform === 'win32';

        return isWindows;
    }

    private openSecretsFile(secretsFilePath: string): void {
        const setting: vscode.Uri = vscode.Uri.parse(secretsFilePath);
        vscode.workspace.openTextDocument(setting).then((doc: vscode.TextDocument) => {
            vscode.window.showTextDocument(doc, 1, false);
        });
    }
}