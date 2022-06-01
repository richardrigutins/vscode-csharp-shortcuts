import * as vscode from 'vscode';
import { AddExistingProjectCommand, AddProjectReferenceCommand, BaseFileCommand, BuildCommand, CleanCommand, ManageNuGetPackagesCommand, ManageUserSecretsCommand, RebuildCommand, RunProjectCommand } from './commands';

export function activate(context: vscode.ExtensionContext) {
	const fileCommands: Map<string, BaseFileCommand> = new Map<string, BaseFileCommand>([
		['csharp-shortcuts.addExistingProject', new AddExistingProjectCommand()],
		['csharp-shortcuts.addProjectReference', new AddProjectReferenceCommand()],
		['csharp-shortcuts.manageNuGetPackages', new ManageNuGetPackagesCommand()],
		['csharp-shortcuts.manageUserSecrets', new ManageUserSecretsCommand()],
		['csharp-shortcuts.build', new BuildCommand()],
		['csharp-shortcuts.clean', new CleanCommand()],
		['csharp-shortcuts.rebuild', new RebuildCommand()],
		['csharp-shortcuts.runProject', new RunProjectCommand()],
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

export function deactivate() {
	// nothing to deactivate
}
