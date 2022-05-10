import { BaseCommand } from ".";
import * as vscode from 'vscode';
import { FileUtilities } from "../utilities";
import { ProjectReferenceQuickPickItem } from "../interfaces";
import path = require("path");

export class AddExistingProjectCommand implements BaseCommand {
    async run(slnPath: string): Promise<void> {
        let projects: string[] = await this.findAllProjects();
        if (projects.length > 0) {
            let addedProjects = await this.readAddedProjects(slnPath);
            let quickPickItems: ProjectReferenceQuickPickItem[] = this.buildSelectProjectsQuickPickItems(projects, addedProjects);
            this.showSelectProjectsQuickPick(quickPickItems, slnPath);
        }
        else {
            vscode.window.showErrorMessage('No projects found in the current workspace');
        }
    }

    private async findAllProjects(): Promise<string[]> {
        return await FileUtilities.findProjectFiles();
    }

    private async readAddedProjects(slnPath: string): Promise<string[]> {
        return await FileUtilities.readAddedProjects(slnPath);
    }

    private buildSelectProjectsQuickPickItems(projects: string[], addedProjects: string[]): ProjectReferenceQuickPickItem[] {
        let items: ProjectReferenceQuickPickItem[] = projects.map(project => {
            let isAdded = addedProjects.some(addedProject => addedProject === project);
            let projectName = path.basename(project, '.csproj');
            let fullPath = project;
            return {
                projectName: projectName,
                fullPath: fullPath,
                initialValue: isAdded,
                label: projectName,
                picked: isAdded,
                description: fullPath,
            };
        }).sort((a, b) => a.projectName.localeCompare(b.projectName));

        return items;
    }

    private showSelectProjectsQuickPick(quickPickItems: ProjectReferenceQuickPickItem[], slnPath: string): void {
        let quickPick = vscode.window.createQuickPick();
        quickPick.items = quickPickItems;
        quickPick.placeholder = 'Add or remove projects from the solution';
        quickPick.selectedItems = quickPickItems.filter(item => item.picked);
        quickPick.canSelectMany = true;
        quickPick.onDidAccept(() => {
            //TODO: Add logic to add projects to the solution

            quickPick.hide();
        });

        quickPick.show();
    }
}