import { NugetReferenceQuickPickItem, NugetSearchResultItem, PackageReference } from '../interfaces';
import * as FileUtilities from "../utilities/fileUtilities";
import * as NugetUtilities from '../utilities/nugetUtilities';
import { BaseFileCommand } from '.';
import compareVersions from 'compare-versions';
import * as vscode from 'vscode';
import { executeDotnetCommand } from '../utilities/executeCommand';

/**
 * Runs the command to manage NuGet packages on a csproj file.
 */
export class ManageNuGetPackagesCommand implements BaseFileCommand {
	private readonly searchPackageQuickPickItem: NugetReferenceQuickPickItem = {
		packageName: '',
		label: 'Search...',
		versions: [],
		alwaysShow: true,
	};

	async run(csprojPath: string) {
		const packageReferences = await this.getCurrentPackageReferences(csprojPath);
		const items = this.buildManagePackagesQuickPickItems(packageReferences);
		this.showManagePackagesQuickPick(items, csprojPath, packageReferences);
	}

	/**
	 * Reads the current package references from the csproj file.
	 * @param csprojPath The absolute path to the csproj file
	 * @returns The package references
	 */
	private async getCurrentPackageReferences(csprojPath: string): Promise<PackageReference[]> {
		return FileUtilities.readPackageReferences(csprojPath);
	}

	private buildManagePackagesQuickPickItems(packageReferences: PackageReference[]): NugetReferenceQuickPickItem[] {
		const result: NugetReferenceQuickPickItem[] = [];
		result.push(this.searchPackageQuickPickItem);

		packageReferences.forEach(packageReference => {
			result.push({
				packageName: packageReference.Include,
				versions: [packageReference.Version],
				label: packageReference.Include,
				description: packageReference.Version,
			});
		});

		return result;
	}

	private showManagePackagesQuickPick(quickPickItems: NugetReferenceQuickPickItem[], csprojPath: string, packageReferences: PackageReference[]) {
		const quickPick = vscode.window.createQuickPick<NugetReferenceQuickPickItem>();
		quickPick.items = quickPickItems;
		quickPick.placeholder = 'Select an installed package to manage or search for a new one';

		quickPick.onDidChangeSelection(items => {
			quickPick.busy = true;
			quickPick.enabled = false;
			let item = items[0];
			if (item === this.searchPackageQuickPickItem) {
				this.showSearchPackageQuickPick(quickPick.value, csprojPath, packageReferences);
			}
			else {
				this.showManagePackageQuickPick(csprojPath, item);
			}
		});

		quickPick.show();
	}

	private showSearchPackageQuickPick(value: string, csprojPath: string, installedPackages: PackageReference[]): void {
		this.searchNugetPackages(value).then(packages => {
			const validPackages = packages.filter(p => !installedPackages.some(i => i.Include === p.id));
			const quickPickItems = this.buildSearchPackageQuickPickItems(validPackages);
			const quickPick = vscode.window.createQuickPick<NugetReferenceQuickPickItem>();
			quickPick.items = quickPickItems;
			quickPick.placeholder = 'Select a package to add or search for another';
			quickPick.value = value;

			quickPick.onDidChangeSelection(items => {
				quickPick.busy = true;
				quickPick.enabled = false;
				const item = items[0];
				if (item === this.searchPackageQuickPickItem) {
					this.showSearchPackageQuickPick(quickPick.value, csprojPath, installedPackages);
				}
				else {
					this.showInstallPackageVersionQuickPick(item.versions, csprojPath, item.packageName);
				}
			});

			quickPick.show();
		});
	}

	private async searchNugetPackages(searchText: string): Promise<NugetSearchResultItem[]> {
		const prerelease = vscode.workspace
			.getConfiguration('csharp-shortcuts')
			.get<boolean>('searchPrereleasePackages') ?? false;
		return NugetUtilities.searchNugetPackages(searchText, prerelease);
	}

	private buildSearchPackageQuickPickItems(nugetSearchResults: NugetSearchResultItem[]): NugetReferenceQuickPickItem[] {
		const result: NugetReferenceQuickPickItem[] = [];
		result.push(this.searchPackageQuickPickItem);

		nugetSearchResults.forEach(packageReference => {
			result.push({
				packageName: packageReference.id,
				versions: packageReference.versions.map(v => v.version),
				label: packageReference.id,
				description: `${packageReference.authors.join(', ')} - ${packageReference.description}`,
			});
		});

		return result;
	}

	private showInstallPackageVersionQuickPick(versions: string[], csprojPath: string, selectedPackage: string, currentVersion?: string): void {
		const sortedItems = [...versions].sort((a, b) => compareVersions(a, b)).reverse();
		const placeHolder = currentVersion ? `Select a version (current ${currentVersion})` : `Select a version`;
		vscode.window.showQuickPick(sortedItems, {
			placeHolder: placeHolder
		}).then(version => {
			if (version) {
				const selectedVersion = version;
				this.addPackageReference(csprojPath, selectedPackage, selectedVersion);
			}
		});
	}

	/**
	 * Adds a package reference executing the _dotnet add_ command.
	 * @param csprojPath The absolute path to the csproj file
	 * @param packageName The name of the package to add
	 * @param packageVersion The version of the package to add
	 */
	private addPackageReference(csprojPath: string, packageName: string, packageVersion: string): void {
		executeDotnetCommand(['add', `"${csprojPath}"`, 'package', `${packageName}`, '--version', `${packageVersion}`]);
	}

	private showManagePackageQuickPick(csprojPath: string, selectedPackage: NugetReferenceQuickPickItem): void {
		const updateOption = 'Update';
		const removeOption = 'Remove';
		const options = [updateOption, removeOption];
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = options.map(option => { return { label: option }; });
		quickPick.placeholder = 'Select an option';
		quickPick.onDidChangeSelection(items => {
			let option = items[0].label;
			if (option === updateOption) {
				quickPick.busy = true;
				quickPick.enabled = false;
				const packageName = selectedPackage.packageName;
				const packageVersion = selectedPackage.versions[0];
				this.showUpdatePackageQuickPick(csprojPath, packageName, packageVersion);
			}
			else if (option === removeOption) {
				this.removePackageReference(csprojPath, selectedPackage.packageName);
			}
		});

		quickPick.show();
	}

	/**
	 * Removes a package reference executing the _dotnet remove_ command.
	 * @param csprojPath The absolute path to the csproj file
	 * @param packageName The name of the package to remove
	 */
	private removePackageReference(csprojPath: string, packageName: string): void {
		executeDotnetCommand(['remove', `"${csprojPath}"`, 'package', `${packageName}`]);
	}

	private showUpdatePackageQuickPick(csprojPath: string, packageName: string, packageVersion: string): void {
		this.searchNugetPackages(packageName).then(items => {
			const foundPackage = items.find(p => p.id === packageName);
			if (foundPackage) {
				const versions = foundPackage.versions.filter(v => v.version !== packageVersion).map(v => v.version);
				if (versions.length > 0) {
					this.showInstallPackageVersionQuickPick(versions, csprojPath, packageName, packageVersion);
				}
				else {
					vscode.window.showErrorMessage(`No updates available for ${packageName}`);
				}
			}
			else {
				vscode.window.showErrorMessage(`Could not find package ${packageName}`);
			}
		});
	}
}
