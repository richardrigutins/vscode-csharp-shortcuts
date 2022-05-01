import path = require("path");
import * as vscode from 'vscode';
import { ProjectReferenceQuickPickItem } from "../interfaces";

export module QuickPickUtilities {
    /**
     * Builds a list of project reference quick pick items.
     * @param currentReferences List of absolute paths of the current project references
     * @param allProjects List of absolute paths of all projects to show in the quick pick
     * @returns The list of quick pick items
     */
    export function buildProjectReferenceQuickPickItems(currentReferences: string[], allProjects: string[]): ProjectReferenceQuickPickItem[] {
        let items = allProjects.map(project => {
            let isReferenced = currentReferences.includes(project);
            let projectName = path.basename(project, '.csproj');
            let fullPath = project;
            return {
                projectName: projectName,
                fullPath: fullPath,
                initialValue: isReferenced,
                label: projectName,
                picked: isReferenced,
                description: fullPath,
            };
        }).sort((a, b) => a.projectName.localeCompare(b.projectName));

        return items;
    }

    /**
     * Builds a quick pick for selecting project references.
     * @param items The list of quick pick items
     * @returns The quick pick
     */
    export function buildProjectReferenceQuickPick(items: ProjectReferenceQuickPickItem[]): vscode.QuickPick<ProjectReferenceQuickPickItem> {
        let quickPick = vscode.window.createQuickPick<ProjectReferenceQuickPickItem>();
        quickPick.items = items;
        quickPick.selectedItems = items.filter(i => i.picked); // Show the current references as selected
        quickPick.placeholder = 'Select project references to add';
        quickPick.canSelectMany = true;

        // Whenever a user changes the selection of an item, update the picked property
        quickPick.onDidChangeSelection(selectedItems => {
            items.forEach(i => i.picked = selectedItems.some(s => s.fullPath === i.fullPath));
        });

        return quickPick;
    }
}