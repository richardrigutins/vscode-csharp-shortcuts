import * as vscode from 'vscode';
import { AddProjectReferenceCommand } from './commands';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('csharp-shortcuts.addProjectReference', async (csprojUri: vscode.Uri) => {
		try {
			let command = new AddProjectReferenceCommand();
			await command.run(csprojUri.fsPath);
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage("An error occurred while updating the project references.");
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
