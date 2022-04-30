import path = require('path');
import * as vscode from 'vscode';
import { ProjectReferenceQuickPickItem } from '../interfaces';
import { FileUtilities, TerminalUtilities } from '../utilities';

export class AddProjectReferenceCommand {
    public async run(csprojPath: string) {
        let projectReferences = await this.getCurrentProjectReferences(csprojPath);
        let otherProjects = await this.findOtherProjects(csprojPath);
        let quickPickItems = await this.buildQuickPickItems(projectReferences, otherProjects);
        let quickPick = this.buildQuickPick(csprojPath, quickPickItems);
        quickPick.show();
    }

    private async getCurrentProjectReferences(csprojPath: string): Promise<string[]> {
        return await FileUtilities.readProjectReferences(csprojPath);
    }

    private async findOtherProjects(csprojPath: string): Promise<string[]> {
        return await FileUtilities.findProjectFiles().then(files => files.filter(f => f !== csprojPath));
    }

    private async buildQuickPickItems(currentReferences: string[], allProjects: string[]): Promise<ProjectReferenceQuickPickItem[]> {
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

    private buildQuickPick(csprojPath: string, items: ProjectReferenceQuickPickItem[]): vscode.QuickPick<ProjectReferenceQuickPickItem> {
        let quickPick = vscode.window.createQuickPick<ProjectReferenceQuickPickItem>();
        quickPick.items = items;
        quickPick.selectedItems = items.filter(i => i.picked);
        quickPick.placeholder = 'Select project references to add';
        quickPick.canSelectMany = true;

        quickPick.onDidChangeSelection(selectedItems => {
            items.forEach(i => i.picked = selectedItems.some(s => s.fullPath === i.fullPath));
        });

        quickPick.onDidAccept(() => {
            this.updateProjectReferences(csprojPath, items);
            quickPick.hide();
        });

        return quickPick;
    }

    private async updateProjectReferences(csprojPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
        await this.addProjectReferences(csprojPath, quickPickItems);
        await this.removeProjectReferences(csprojPath, quickPickItems);
    }

    private async addProjectReferences(csprojPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
        let projectsToAdd = quickPickItems.filter(e => !e.initialValue && e.picked);
        let invalidProjects = await this.findCircularReferences(csprojPath, projectsToAdd);
        let validProjects = projectsToAdd.filter(e => !invalidProjects.includes(e));

        if (validProjects?.length > 0) {
            TerminalUtilities.executeCommand(`dotnet add '${csprojPath}' reference`, validProjects.map(p => "'" + p.fullPath + "'"));
        }

        invalidProjects.forEach(e => {
            vscode.window.showErrorMessage(`A reference to ${e.projectName} could not be added. Adding this project as a reference would cause a circular dependency.`);
        });
    }

    private async findCircularReferences(currentProjectPath: string, projectsToCheck: ProjectReferenceQuickPickItem[]): Promise<ProjectReferenceQuickPickItem[]> {
        let circularReferences: ProjectReferenceQuickPickItem[] = [];

        let promises = projectsToCheck.map(async (projectToAdd) => this.isCircularReference(currentProjectPath, projectToAdd.fullPath));
        let promisesResults = await Promise.all(promises);
        for (let i = 0; i < promisesResults.length; i++) {
            if (promisesResults[i]) {
                circularReferences.push(projectsToCheck[i]);
            }
        }

        return circularReferences;
    }

    private async isCircularReference(sourceProject: string, targetProject: string): Promise<boolean> {
        let referencesOfTargetProject = await FileUtilities.readProjectReferences(targetProject);
        let isCircularReference = referencesOfTargetProject.includes(sourceProject);

        return isCircularReference;
    }

    private async removeProjectReferences(csprojPath: string, projectReferences: ProjectReferenceQuickPickItem[]) {
        let projectsToRemove = projectReferences.filter(e => e.initialValue && !e.picked);
        if (projectsToRemove?.length > 0) {
            TerminalUtilities.executeCommand(`dotnet remove '${csprojPath}' reference`, projectsToRemove.map(p => "'" + p.fullPath + "'"));
        }
    }
}