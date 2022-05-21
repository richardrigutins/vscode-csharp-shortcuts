import * as vscode from 'vscode';
import { AddExistingProjectCommand, AddProjectReferenceCommand, BaseFileCommand } from './commands';
import { ManageNuGetPackagesCommand } from './commands/manageNuGetPackagesCommand';
import { ManageUserSecretsCommand } from './commands/manageUserSecretsCommand';

export function activate(context: vscode.ExtensionContext) {
	const fileCommands: Map<string, BaseFileCommand> = new Map<string, BaseFileCommand>([
		['csharp-shortcuts.addExistingProject', new AddExistingProjectCommand()],
		['csharp-shortcuts.addProjectReference', new AddProjectReferenceCommand()],
		['csharp-shortcuts.manageNuGetPackages', new ManageNuGetPackagesCommand()],
		['csharp-shortcuts.manageUserSecrets', new ManageUserSecretsCommand()]
	]);

	fileCommands.forEach((command, key) => {
		let disposable = vscode.commands.registerCommand(key, async (uri: vscode.Uri) => {
			try {
				await command.run(uri.fsPath);
			} catch (e) {
				console.error(e);
				if (e instanceof Error) {
					vscode.window.showErrorMessage(e.message);
				}
				else {
					vscode.window.showErrorMessage("An error occurred.");
				}
			}
		});

		context.subscriptions.push(disposable);
	});
}

export function deactivate() { }
