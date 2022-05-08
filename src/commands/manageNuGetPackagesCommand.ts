import * as vscode from 'vscode';
import { NugetReferenceQuickPickItem, NugetSearchResultItem, PackageReference } from '../interfaces';
import { FileUtilities, NugetUtilities, TerminalUtilities } from '../utilities';
import compareVersions = require('compare-versions');

export class ManageNuGetPackagesCommand {
    public async run(csprojPath: string) {
        let packageReferences = await this.getCurrentPackageReferences(csprojPath);
        let quickPickItems = this.buildReferencesQuickPickItems(packageReferences);
        let quickPick = vscode.window.createQuickPick<NugetReferenceQuickPickItem>();
        quickPick.items = quickPickItems;
        quickPick.placeholder = 'Manage an installed package or search for a new one';

        quickPick.onDidChangeSelection(items => {
            let item = items[0];
            if (item.packageName.length === 0) {
                quickPick.busy = true;
                quickPick.enabled = false;
                this.searchNewPackage(quickPick.value, csprojPath, packageReferences);
            }
            else {
                this.managePackage(csprojPath, item);
            }
        });

        quickPick.show();
    }

    private searchNewPackage(value: string, csprojPath: string, installedPackages: PackageReference[]): void {
        this.searchNugetPackages(value).then(items => {
            let validPackages = items.filter(p => !installedPackages.some(i => i.Include === p.id));
            let quickPickItems = this.buildPackagesQuickPickItems(validPackages);
            let quickPick = vscode.window.createQuickPick<NugetReferenceQuickPickItem>();
            quickPick.items = quickPickItems;
            quickPick.placeholder = 'Select a package to add';

            quickPick.onDidChangeSelection(items => {
                let item = items[0];
                if (item.packageName.length === 0) {
                    quickPick.busy = true;
                    quickPick.enabled = false;
                    this.searchNewPackage(quickPick.value, csprojPath, installedPackages);
                }
                else {
                    let selectedPackage = item.packageName;
                    const versions = item.versions;
                    this.installPackageVersion(versions, csprojPath, selectedPackage);
                }
            });

            quickPick.show();
        });
    }

    private installPackageVersion(versions: string[], csprojPath: string, selectedPackage: string, currentVersion?: string): void {
        const sortedItems = versions.sort((a, b) => compareVersions(a, b)).reverse();
        const placeHolder = currentVersion ? `Select a version (current ${currentVersion})` : `Select a version`;
        vscode.window.showQuickPick(sortedItems, {
            placeHolder: placeHolder
        }).then(version => {
            if (version) {
                let selectedVersion = version;
                this.addPackageReference(csprojPath, selectedPackage, selectedVersion);
            }
        });
    }

    private async managePackage(csprojPath: string, selectedPackage: NugetReferenceQuickPickItem): Promise<void> {
        const options = ['Update', 'Remove'];
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = options.map(option => { return { label: option }; });
        quickPick.placeholder = 'Select an option';
        quickPick.onDidChangeSelection(items => {
            let option = items[0].label;
            if (option === 'Update') {
                quickPick.busy = true;
                quickPick.enabled = false;
                const packageName = selectedPackage.packageName;
                const packageVersion = selectedPackage.versions[0];
                this.searchNugetPackages(packageName).then(items => {
                    const foundPackage = items.find(p => p.id === packageName);
                    if (foundPackage) {
                        const versions = foundPackage.versions.filter(v => v.version !== packageVersion).map(v => v.version);
                        if (versions.length > 0) {
                            this.installPackageVersion(versions, csprojPath, packageName, packageVersion);
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
            else if (option === 'Remove') {
                this.removePackageReference(csprojPath, selectedPackage.packageName);
            }
        });

        quickPick.show();
    }

    private async getCurrentPackageReferences(csprojPath: string): Promise<PackageReference[]> {
        return await FileUtilities.readPackageReferences(csprojPath);
    }

    private createSearchPackageItem(label: string): NugetReferenceQuickPickItem {
        return {
            packageName: '',
            label: label,
            versions: [],
            alwaysShow: true,
        };
    }

    private buildReferencesQuickPickItems(packageReferences: PackageReference[]): NugetReferenceQuickPickItem[] {
        let result: NugetReferenceQuickPickItem[] = [];
        result.push(this.createSearchPackageItem('Search for a new package...'));

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

    private buildPackagesQuickPickItems(nugetSearchResults: NugetSearchResultItem[]): NugetReferenceQuickPickItem[] {
        let result: NugetReferenceQuickPickItem[] = [];
        result.push(this.createSearchPackageItem('Search for a package...'));

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

    private async searchNugetPackages(searchText: string): Promise<NugetSearchResultItem[]> {
        const prerelease = vscode.workspace
                                .getConfiguration('csharp-shortcuts')
                                .get<boolean>('searchPrereleasePackages') ?? false;
        return await NugetUtilities.searchNugetPackages(searchText, prerelease);
    }

    /**
     * Adds a package reference executing the dotnet add command.
     * @param csprojPath The absolute path to the csproj file
     * @param packageName The name of the package to add
     * @param packageVersion The version of the package to add
     */
    private addPackageReference(csprojPath: string, packageName: string, packageVersion: string): void {
        TerminalUtilities.executeCommand(`dotnet add '${csprojPath}' package ${packageName}`, [`--version ${packageVersion}`]);
    }

    /**
     * Removes a package reference executing the dotnet remove command.
     * @param csprojPath The absolute path to the csproj file
     * @param packageName The name of the package to remove
     */
    private removePackageReference(csprojPath: string, packageName: string): void {
        TerminalUtilities.executeCommand(`dotnet remove '${csprojPath}' package ${packageName}`);
    }
}