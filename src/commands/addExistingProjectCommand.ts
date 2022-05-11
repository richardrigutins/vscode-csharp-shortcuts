import { BaseCommand } from ".";
import * as vscode from 'vscode';
import { FileUtilities, TerminalUtilities } from "../utilities";
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
        return await FileUtilities.readProjectsFromSolution(slnPath);
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
        let quickPick = vscode.window.createQuickPick<ProjectReferenceQuickPickItem>();
        quickPick.items = quickPickItems;
        quickPick.placeholder = 'Select the projects that should be in the solution';
        quickPick.selectedItems = quickPickItems.filter(item => item.picked);
        quickPick.canSelectMany = true;

        // Whenever a user changes the selection of an item, update the picked property
        quickPick.onDidChangeSelection(selectedItems => {
            quickPickItems.forEach(i => i.picked = selectedItems.some(s => s.fullPath === i.fullPath));
        });

        quickPick.onDidAccept(() => {
            this.updateProjects(slnPath, quickPickItems);
            quickPick.hide();
        });

        quickPick.show();
    }

    /**
     * Adds and removes projects from the solution based on the current selection.
     * @param csprojPath The absolute path to the sln file
     * @param quickPickItems The list of items from the quick pick
     */
    private async updateProjects(csprojPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
        await this.addProjects(csprojPath, quickPickItems);
        await this.removeProjects(csprojPath, quickPickItems);
    }

    /**
     * Adds projects to the solution executing the dotnet sln add command
     * @param slnPath The absolute path to the sln file
     * @param quickPickItems The list of items from the quick pick
     */
    private async addProjects(slnPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
        let projectsToAdd = quickPickItems.filter(e => !e.initialValue && e.picked);

        if (projectsToAdd?.length > 0) {
            TerminalUtilities.executeCommand(`dotnet sln '${slnPath}' add`, projectsToAdd.map(p => "'" + p.fullPath + "'"));
        }
    }

    /**
    * Removes projects from the solutino executing the dotnet sln remove command.
    * @param slnPath The absolute path to the sln file
    * @param quickPickItems The list of items from the quick pick
    */
    private async removeProjects(slnPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
        let projectsToRemove = quickPickItems.filter(e => e.initialValue && !e.picked);
        if (projectsToRemove?.length > 0) {
            TerminalUtilities.executeCommand(`dotnet sln '${slnPath}' remove`, projectsToRemove.map(p => "'" + p.fullPath + "'"));
        }
    }
}