import { ProjectReferenceQuickPickItem } from "../interfaces";
import * as FileUtilities from "../utilities/fileUtilities";
import { BaseFileCommand } from ".";
import * as path from 'path';
import * as vscode from 'vscode';
import { executeDotnetCommand } from "../utilities/executeCommand";

/**
 * Runs the command to add or remove existing projects on a solution file.
 */
export class AddExistingProjectCommand implements BaseFileCommand {
	async run(slnPath: string): Promise<void> {
		const projects: string[] = await this.findAllProjects();
		if (projects.length > 0) {
			const addedProjects = await this.readAddedProjects(slnPath);
			const quickPickItems: ProjectReferenceQuickPickItem[] = this.buildSelectProjectsQuickPickItems(projects, addedProjects);
			this.showSelectProjectsQuickPick(quickPickItems, slnPath);
		}
		else {
			vscode.window.showErrorMessage('No projects found in the current workspace');
		}
	}

	/**
	 * Returns the absolute path to all projects in the current workspace.
	 */
	private async findAllProjects(): Promise<string[]> {
		return FileUtilities.findProjectFiles();
	}

	/**
	 * Parses the content of the sln file and returns the list of projects that are already added to the solution.
	 * @param slnPath The absolute path to the sln file
	 * @returns The absolute path to all projects added to the solution
	 */
	private async readAddedProjects(slnPath: string): Promise<string[]> {
		return FileUtilities.readProjectsFromSolution(slnPath);
	}

	private buildSelectProjectsQuickPickItems(projects: string[], addedProjects: string[]): ProjectReferenceQuickPickItem[] {
		const items: ProjectReferenceQuickPickItem[] = projects.map(project => {
			const isAdded = addedProjects.some(addedProject => addedProject === project);
			const projectName = path.basename(project, '.csproj');
			const fullPath = project;
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
		const quickPick = vscode.window.createQuickPick<ProjectReferenceQuickPickItem>();
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
	 * @param slnPath The absolute path to the sln file
	 * @param quickPickItems The list of items from the quick pick
	 */
	private async updateProjects(slnPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
		await this.addProjects(slnPath, quickPickItems);
		await this.removeProjects(slnPath, quickPickItems);
	}

	/**
	 * Adds projects to the solution executing the _dotnet sln add_ command.
	 * @param slnPath The absolute path to the sln file
	 * @param quickPickItems The list of items from the quick pick
	 */
	private async addProjects(slnPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
		const projectsToAdd = quickPickItems.filter(e => !e.initialValue && e.picked);
		if (projectsToAdd?.length > 0) {
			await executeDotnetCommand(['sln', `"${slnPath}"`, 'add', ...projectsToAdd.map(p => "\"" + p.fullPath + "\"")]);
		}
	}

	/**
	* Removes projects from the solution executing the _dotnet sln remove_ command.
	* @param slnPath The absolute path to the sln file
	* @param quickPickItems The list of items from the quick pick
	*/
	private async removeProjects(slnPath: string, quickPickItems: ProjectReferenceQuickPickItem[]) {
		const projectsToRemove = quickPickItems.filter(e => e.initialValue && !e.picked);
		if (projectsToRemove?.length > 0) {
			await executeDotnetCommand(['sln', `"${slnPath}"`, 'remove', ...projectsToRemove.map(p => "\"" + p.fullPath + "\"")]);
		}
	}
}
