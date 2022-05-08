import * as vscode from 'vscode';
import { AddProjectReferenceCommand } from './commands';
import { ManageNuGetPackagesCommand } from './commands/manageNuGetPackagesCommand';

export function activate(context: vscode.ExtensionContext) {
	let projectReferenceDisposable = vscode.commands.registerCommand('csharp-shortcuts.addProjectReference', async (csprojUri: vscode.Uri) => {
		try {
			let command = new AddProjectReferenceCommand();
			await command.run(csprojUri.fsPath);
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage("An error occurred while updating the project references.");
		}
	});

	context.subscriptions.push(projectReferenceDisposable);

	let packageReferenceDisposable = vscode.commands.registerCommand('csharp-shortcuts.manageNuGetPackages', async (csprojUri: vscode.Uri) => {
		try {
			let command = new ManageNuGetPackagesCommand();
			await command.run(csprojUri.fsPath);
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage("An error occurred while updating the package references.");
		}
	});

	context.subscriptions.push(packageReferenceDisposable);
}

export function deactivate() { }
