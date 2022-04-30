import path = require('path');
import * as vscode from 'vscode';
import { CsprojFile } from '../interfaces';
import * as xml2js from 'xml2js';

export module FileUtilities {
    export async function readProjectReferences(csprojPath: string): Promise<string[]> {
        const projectFolder = path.dirname(csprojPath);
        const document = await vscode.workspace.openTextDocument(csprojPath);
        const csprojContent = document.getText();
        const csprojObject: CsprojFile = await xml2js.parseStringPromise(csprojContent, { trim: true });

        let projectReferences = csprojObject?.Project?.ItemGroup?.flatMap(i => i.ProjectReference).filter(r => r).map(r => {
            let referenceRelativePath = path.normalize(r.$.Include);
            let referenceAbsolutePath = path.resolve(projectFolder, referenceRelativePath);
            return referenceAbsolutePath;
        });

        return projectReferences;
    }

    export async function findProjectFiles(): Promise<string[]> {
        const globPattern = '**/*.{csproj}';
        const projectUris = await vscode.workspace.findFiles(globPattern);

        return projectUris.map(u => u.fsPath);
    }

    export async function containsProjectReference(sourcePath: string, projectToCheck: string): Promise<boolean> {
        const projectReferences = await readProjectReferences(sourcePath);
        const isIncluded = projectReferences.includes(projectToCheck);

        return isIncluded;
    }
}
