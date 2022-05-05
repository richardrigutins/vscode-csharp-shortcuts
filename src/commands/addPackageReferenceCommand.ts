import * as vscode from 'vscode';
import { NugetSearchResultItem } from '../interfaces';
import { NugetUtilities } from '../utilities';

export class AddPackageReferenceCommand {
    public async run(csprojPath: string) {
        vscode.window.showInputBox({ prompt: 'Search for package' })
        .then(async searchText => {
            let search: string = searchText ?? '';
            let items = await this.searchNugetPackages(search, false);
            vscode.window.showQuickPick(items.map(item => item.id), { placeHolder: 'Select package to add' })
            .then(async selectedPackage => {
                console.log(`Selected package: ${selectedPackage}`);
            });
        });
    }

    private async searchNugetPackages(searchText: string, prerelease: boolean): Promise<NugetSearchResultItem[]> {
        return await NugetUtilities.searchNugetPackages(searchText, prerelease);
    }
}