import { CsprojFile, Item, PackageReference, PropertyGroup } from '../interfaces';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export module FileUtilities {
    /**
     * Parses the content of the selected csproj file and returns the absolute path for all referenced projects
     * @param csprojPath The path to the csproj file
     * @returns The absolute path for all referenced projects
     */
    export async function readProjectReferences(csprojPath: string): Promise<string[]> {
        const parsedCsproj: CsprojFile = await parseCsprojContent(csprojPath);
        const itemGroups = getItemGroups(parsedCsproj);
        const projectFolder = path.dirname(csprojPath);
        const result = itemGroups.flatMap(i => i.ProjectReference).filter(r => r).map(r => getAbsolutePath(r.Include, projectFolder));

        return result;
    }

    async function parseCsprojContent(csprojPath: string): Promise<CsprojFile> {
        const csprojContent = await readFileContent(csprojPath);
        // Project references are stored as attributes, so they shouldn't be ignored
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
        const result: CsprojFile = parser.parse(csprojContent);
        return result;
    }

    async function readFileContent(filePath: string): Promise<string> {
        const document = await vscode.workspace.openTextDocument(filePath);
        const fileContent = document.getText();

        return fileContent;
    }

    function getItemGroups(csproj: CsprojFile): Item[] {
        let result: Item[] = [];
        if (csproj?.Project?.ItemGroup) {
            const itemGroupElement = csproj.Project.ItemGroup;

            // If only one ItemGroup element is present the parser doesn't consider it as an array, so we need to wrap it in an array
            result = Array.isArray(itemGroupElement) ? itemGroupElement : [itemGroupElement];
        }

        return result;
    }

    /**
     * Converts the relative path of a project reference to an absolute path given the folder of the current project
     * @param relativePath The relative path of a project reference
     * @param projectFolder The folder containing the current project
     * @returns The absolute path of the project reference
     */
    function getAbsolutePath(relativePath: string, projectFolder: string): string {
        let result = path.resolve(projectFolder, relativePath);
        return result;
    }

    /**
     * Checks if the csproj file on path sourcePath contains a project reference to projectToCheck
     * @param sourcePath The path to the source csproj file
     * @param projectToCheck The absolute path to the project to check
     * @returns true if the project to check is referenced by the source csproj file, false otherwise
     */
    export async function containsProjectReference(sourcePath: string, projectToCheck: string): Promise<boolean> {
        const projectReferences = await readProjectReferences(sourcePath);
        const isIncluded = projectReferences.includes(projectToCheck);
        return isIncluded;
    }

    /**
     * Returns the absolute paths of all csproj files in the current workspace.
     * @param projectsToExclude An optional array of projects to exclude from the search
     */
    export async function findProjectFiles(projectsToExclude?: string[]): Promise<string[]> {
        const globPattern = '**/*.csproj';
        const projectUris = await vscode.workspace.findFiles(globPattern);
        let result = projectUris.map(u => u.fsPath);

        if (projectsToExclude) {
            result = result.filter(p => !projectsToExclude.includes(p));
        }
        return result;
    }

    /**
     * Parses the content of the selected csproj file and returns the package references.
     * @param csprojPath The path to the csproj file
     * @returns The package references of the csproj file
     */
    export async function readPackageReferences(csprojPath: string): Promise<PackageReference[]> {
        const parsedCsproj: CsprojFile = await parseCsprojContent(csprojPath);
        const itemGroups = getItemGroups(parsedCsproj);
        const result = itemGroups.flatMap(i => i.PackageReference).filter(r => r);

        return result;
    }

    /**
     * Reads the content of a sln file and returns the path of all projects in the solution
     * @param slnFilePath The path to the sln file
     * @returns The absolute paths of the projects in the solution
     */
    export async function readProjectsFromSolution(slnFilePath: string): Promise<string[]> {
        let fileContent = await readFileContent(slnFilePath);
        let regex = /Project\(\"\{[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\}\"\) = \"(.*)\"/g;
        let matches = fileContent.match(regex);
        let folder = path.dirname(slnFilePath);
        let projects: string[] = matches?.flatMap(r => path.resolve(folder, r.split('"')[5])) ?? [];

        return projects;
    }

    /**
     * Parses the content of the selected csproj file and returns the PropertyGroup object
     * @param csprojPath The path to the csproj file
     */
    async function readPropertyGroup(csprojPath: string): Promise<PropertyGroup> {
        const parsedCsproj: CsprojFile = await parseCsprojContent(csprojPath);
        const result = parsedCsproj.Project.PropertyGroup;

        return result;
    }

    /**
     * Parses the content of the selected csproj file and returns the user secrets id
     * @param csprojPath The path to the csproj file
     */
    export async function readUserSecretsId(csprojPath: string): Promise<string> {
        const propertyGroup = await readPropertyGroup(csprojPath);
        return propertyGroup?.UserSecretsId;
    }

    /**
     * Checks if the given path exists
     */
    export function pathExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }
}
