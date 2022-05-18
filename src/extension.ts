import * as vscode from 'vscode';
import { AddExistingProjectCommand, AddProjectReferenceCommand } from './commands';
import { ManageNuGetPackagesCommand } from './commands/manageNuGetPackagesCommand';
import { ManageUserSecretsCommand } from './commands/manageUserSecretsCommand';
var os = require('os');

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

	let addExistingProjectDisposable = vscode.commands.registerCommand('csharp-shortcuts.addExistingProject', async (slnUri: vscode.Uri) => {
		try {
			let command = new AddExistingProjectCommand();
			await command.run(slnUri.fsPath);
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage("An error occurred while adding a project.");
		}
	});

	context.subscriptions.push(addExistingProjectDisposable);

	let manageUserSecretsDisposable = vscode.commands.registerCommand('csharp-shortcuts.manageUserSecrets', async (csprojUri: vscode.Uri) => {
		try {
			let command = new ManageUserSecretsCommand();
			await command.run(csprojUri.fsPath);
		} catch (e) {
			console.error(e);
			vscode.window.showErrorMessage("An error occurred while managing user secrets.");
		}
	});

	context.subscriptions.push(manageUserSecretsDisposable);
}

export function deactivate() { }
