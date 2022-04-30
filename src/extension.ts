import * as vscode from 'vscode';
import { AddProjectReferenceCommand } from './commands';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('csharp-shortcuts.addProjectReference', async (csprojUri: vscode.Uri) => {
		let command = new AddProjectReferenceCommand();
		command.run(csprojUri.fsPath);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
