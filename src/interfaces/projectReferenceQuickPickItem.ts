import * as vscode from 'vscode';

/**
 * Represents an item that can be selected from
 * a list of project references to be added or removed.
 */
export interface ProjectReferenceQuickPickItem extends vscode.QuickPickItem {
	projectName: string,
	fullPath: string,
	initialValue: boolean,
}
