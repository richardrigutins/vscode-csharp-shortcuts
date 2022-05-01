import * as vscode from 'vscode';
import { ProjectReferenceQuickPickItem } from '../interfaces';
import { FileUtilities, TerminalUtilities } from '../utilities';
import { QuickPickUtilities } from '../utilities/quickPickUtilities';

export class AddProjectReferenceCommand {
    /**
     * Runs the command to add or remove project references
     * @param csprojPath The absolute path to the csproj file
     */
    public async run(csprojPath: string) {
        let projectReferences = await this.getCurrentProjectReferences(csprojPath);
        let otherProjects = await this.findOtherProjects(csprojPath);
        let quickPickItems = await this.buildQuickPickItems(projectReferences, otherProjects);
        let quickPick = this.buildQuickPick(quickPickItems);
        quickPick.onDidAccept(() => {
            this.updateProjectReferences(csprojPath, quickPickItems);
            quickPick.hide();
        });

        quickPick.show();
    }

    private async getCurrentProjectReferences(csprojPath: string): Promise<string[]> {
        return await FileUtilities.readProjectReferences(csprojPath);
    }

    private async findOtherProjects(csprojPath: string): Promise<string[]> {
        return await FileUtilities.findProjectFiles().then(files => files.filter(f => f !== csprojPath));
    }

    private async buildQuickPickItems(currentReferences: string[], allProjects: string[]): Promise<ProjectReferenceQuickPickItem[]> {
        return QuickPickUtilities.buildProjectReferenceQuickPickItems(currentReferences, allProjects);
    }

    private buildQuickPick(items: ProjectReferenceQuickPickItem[]): vscode.QuickPick<ProjectReferenceQuickPickItem> {
        return QuickPickUtilities.buildProjectReferenceQuickPick(items);
    }

    /**
     * Adds and removes project references based on the current selection.
     * @param csprojPath The absolute path to the csproj file
     * @param quickPickItems The list of items from the quick pick
     */
    private async updateProjectReferences(csprojPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
        await this.addProjectReferences(csprojPath, quickPickItems);
        await this.removeProjectReferences(csprojPath, quickPickItems);
    }

    /**
     * Adds project references executing the dotnet add command, and shows an error message if the reference is circular.
     * @param csprojPath The absolute path to the csproj file
     * @param quickPickItems The list of items from the quick pick
     */
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

    /**
     * Finds which projects would cause a circular reference if added.
     * @param currentProjectPath The absolute path to the csproj file
     * @param projectsToCheck The list of projects that would be added as references
     * @returns A list of projects that would cause a circular reference if added
     */
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

    /**
     * Checks if a project would cause a circular reference if added.
     * @param sourceProject The absolute path to the csproj file
     * @param targetProject The absolute path to the project to check
     * @returns true if the project would cause a circular reference if added
     */
    private async isCircularReference(sourceProject: string, targetProject: string): Promise<boolean> {
        let referencesOfTargetProject = await FileUtilities.readProjectReferences(targetProject);
        let isCircularReference = referencesOfTargetProject.includes(sourceProject);

        return isCircularReference;
    }

    /**
     * Removes project references executing the dotnet remove command.
     * @param csprojPath The absolute path to the csproj file
     * @param projectReferences The list of items from the quick pick
     */
    private async removeProjectReferences(csprojPath: string, projectReferences: ProjectReferenceQuickPickItem[]) {
        let projectsToRemove = projectReferences.filter(e => e.initialValue && !e.picked);
        if (projectsToRemove?.length > 0) {
            TerminalUtilities.executeCommand(`dotnet remove '${csprojPath}' reference`, projectsToRemove.map(p => "'" + p.fullPath + "'"));
        }
    }
}