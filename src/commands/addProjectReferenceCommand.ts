import { ProjectReferenceQuickPickItem } from '../interfaces';
import * as FileUtilities from "../utilities/fileUtilities";
import { BaseFileCommand } from '.';
import * as path from 'path';
import * as vscode from 'vscode';
import { executeCommand } from '../utilities/executeCommand';

/**
 * Runs the command to add or remove project references on a csproj file.
 */
export class AddProjectReferenceCommand implements BaseFileCommand {
	async run(csprojPath: string) {
		const otherProjects = await this.findOtherProjects(csprojPath);
		if (otherProjects.length > 0) {
			const projectReferences = await this.getCurrentProjectReferences(csprojPath);
			const quickPickItems = await this.buildProjectsQuickPickItems(projectReferences, otherProjects);
			const quickPick = this.buildProjectsQuickPick(quickPickItems);
			quickPick.onDidAccept(() => {
				this.updateProjectReferences(csprojPath, quickPickItems);
				quickPick.hide();
			});

			quickPick.show();
		} else {
			vscode.window.showInformationMessage('No other projects found in the current workspace.');
		}
	}

	private async getCurrentProjectReferences(csprojPath: string): Promise<string[]> {
		return FileUtilities.readProjectReferences(csprojPath);
	}

	private async findOtherProjects(csprojPath: string): Promise<string[]> {
		return FileUtilities.findProjectFiles().then(files => files.filter(f => f !== csprojPath));
	}

	private async buildProjectsQuickPickItems(currentReferences: string[], allProjects: string[]): Promise<ProjectReferenceQuickPickItem[]> {
		return allProjects.map(project => {
			const isReferenced = currentReferences.includes(project);
			const projectName = path.basename(project, '.csproj');
			const fullPath = project;
			return {
				projectName: projectName,
				fullPath: fullPath,
				initialValue: isReferenced,
				label: projectName,
				picked: isReferenced,
				description: fullPath,
			};
		}).sort((a, b) => a.projectName.localeCompare(b.projectName));
	}

	private buildProjectsQuickPick(items: ProjectReferenceQuickPickItem[]): vscode.QuickPick<ProjectReferenceQuickPickItem> {
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

	/**
	 * Adds and removes project references based on the selected quickPickItems.
	 * @param csprojPath The absolute path to the csproj file
	 * @param quickPickItems The list of items from the quick pick
	 */
	private async updateProjectReferences(csprojPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
		await this.addProjectReferences(csprojPath, quickPickItems);
		await this.removeProjectReferences(csprojPath, quickPickItems);
	}

	/**
	 * Adds project references executing the _dotnet add_ command, and shows an error message if the reference is circular.
	 * @param csprojPath The absolute path to the csproj file
	 * @param quickPickItems The list of items from the quick pick
	 */
	private async addProjectReferences(csprojPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
		const projectsToAdd = quickPickItems.filter(e => !e.initialValue && e.picked);
		const invalidProjects = await this.findCircularReferences(csprojPath, projectsToAdd);
		const validProjects = projectsToAdd.filter(e => !invalidProjects.includes(e));

		if (validProjects?.length > 0) {
			executeCommand(`dotnet add "${csprojPath}" reference`, validProjects.map(p => "\"" + p.fullPath + "\""));
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
		const circularReferences: ProjectReferenceQuickPickItem[] = [];

		const promises = projectsToCheck.map(async (projectToAdd) => this.isCircularReference(currentProjectPath, projectToAdd.fullPath));
		const promisesResults = await Promise.all(promises);
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
		const referenceTree = await this.readReferencesTree(targetProject);
		return referenceTree.includes(sourceProject);
	}

	/**
	 * Reads the list of project references of the selected project and of its references
	 * @param targetProject The absolute path to the csproj file
	 * @returns The list of references
	 */
	private async readReferencesTree(targetProject: string): Promise<string[]> {
		const references = await FileUtilities.readProjectReferences(targetProject);
		for (let reference of references) {
			const referencesOfReference = await FileUtilities.readProjectReferences(reference);
			referencesOfReference.forEach(r => {
				if (!references.includes(r)) {
					references.push(r);
				}
			});
		}

		return references;
	}

	/**
	 * Removes project references executing the _dotnet remove_ command.
	 * @param csprojPath The absolute path to the csproj file
	 * @param projectReferences The list of items from the quick pick
	 */
	private async removeProjectReferences(csprojPath: string, projectReferences: ProjectReferenceQuickPickItem[]) {
		const projectsToRemove = projectReferences.filter(e => e.initialValue && !e.picked);
		if (projectsToRemove?.length > 0) {
			executeCommand(`dotnet remove "${csprojPath}" reference`, projectsToRemove.map(p => "\"" + p.fullPath + "\""));
		}
	}
}
