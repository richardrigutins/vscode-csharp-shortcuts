import * as vscode from 'vscode';

/**
 * Represents an item that can be selected from
 * a list of NuGet package references to be added or removed.
 */
 export interface NugetReferenceQuickPickItem extends vscode.QuickPickItem {
	packageName: string,
	versions: string[],
}