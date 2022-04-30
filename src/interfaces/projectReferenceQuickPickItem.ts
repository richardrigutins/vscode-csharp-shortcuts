import * as vscode from 'vscode';

export interface ProjectReferenceQuickPickItem extends vscode.QuickPickItem {
	projectName: string,
	fullPath: string,
	initialValue: boolean,
}
