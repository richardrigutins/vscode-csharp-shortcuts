import * as FileUtilities from "../utilities/fileUtilities";
import * as OsUtilities from '../utilities/osUtilities';
import { BaseFileCommand } from '.';
import * as path from 'path';
import * as vscode from 'vscode';
import { executeDotnetCommand } from "../utilities/executeCommand";

/**
 * Runs the command to manage user secrets on a csproj file.
 */
export class ManageUserSecretsCommand implements BaseFileCommand {
	private readonly backoffRetries = 20;
	private readonly backoffDelay = 500;

	async run(csprojPath: string) {
		let userSecretsId: string | undefined = await this.readUserSecretsId(csprojPath);
		if (!userSecretsId) {
			userSecretsId = await this.initializeUserSecrets(csprojPath);
			if (!userSecretsId) {
				throw new Error(`Failed to read user secrets id from ${csprojPath}.`);
			}
		}

		const secretsFilePath = this.getSecretsFilePath(userSecretsId);
		if (!this.fileExists(secretsFilePath)) {
			await this.createEmptySecretsFile(csprojPath);
		}

		await this.openSecretsFile(secretsFilePath);
	}

	private async readUserSecretsId(csprojPath: string): Promise<string> {
		return FileUtilities.readUserSecretsId(csprojPath);
	}

	private async initializeUserSecrets(csprojPath: string): Promise<string | undefined> {
		await executeDotnetCommand(['user-secrets', 'init', '--project', `"${csprojPath}"`]);
		return await this.readUserSecretsIdWithBackoff(csprojPath);
	}

	private createEmptySecretsFile(csprojPath: string): Promise<void> {
		return executeDotnetCommand(['user-secrets', 'clear', '--project', `"${csprojPath}"`]);
	}

	private async readUserSecretsIdWithBackoff(csprojPath: string): Promise<string | undefined> {
		for (let i = 0; i < this.backoffRetries; i++) {
			await this.waitForMilliseconds(this.backoffDelay);
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

	private async openSecretsFile(secretsFilePath: string): Promise<void> {
		await vscode.workspace.openTextDocument(secretsFilePath).then((doc: vscode.TextDocument) => {
			vscode.window.showTextDocument(doc, 1, false);
		});
	}
}
