# C# Shortcuts
A VS Code extension that adds shortcuts for common operations for C# projects.

## Requirements

This extension requires the dotnet CLI to be installed.

## Features
This extensions adds the following shortcuts to the contextual menu for .csproj files:
- _Add project references_: visually add or remove references to other projects
![add project reference](images/add-project-reference-context-menu.png)
- _Manage NuGet packages_: manage the installed NuGet packages, or search and install new ones
- _Manage user secrets_ : initialize and open the secrets.json file to manage user secrets
- _Build project_: build the project
- _Clean project_: clean the project
- _Rebuild project_: rebuild the project
- _Run project_: runs the project without debugging

This extensions adds the following shortcuts to the contextual menu for .sln files:
- _Add existing projects to a solution_: visually add or remove projects from a solution
- _Build solution_: build the solution
- _Clean solution_: clean the solution
- _Rebuild solution_: rebuild the solution

## Extension Settings

This extension contributes the following settings:

- `csharp-shortcuts.searchPrereleasePackages`: enables searching for prerelease packages in the NuGet package manager

## Known Issues

- Not showing error messages when a file is not found.

## Current Limitations

- Can only search public packages from NuGet.org.

## Release Notes

### 0.0.9

- Added command to run project.

### 0.0.8

- Added commands to build solutions and projects.

### 0.0.7

- Create an empty user secrets file if it doesn't exist.
- Added a progress bar when initializing user secrets.

### 0.0.6

- Fixed an issue when reading project paths from a solution file on Linux and MacOS.

### 0.0.5

- Added command to manage user secrets.

### 0.0.4

- Added option to manage package references.
- Added option to add existing projects to a solution.

### 0.0.1

- Initial preview release.

## Contribute

Open a PR or an issue on GitHub.