import * as TerminalUtilities from "../utilities/terminalUtilities";
import { BaseFileCommand } from ".";

/**
 * Executes the command to run the selected C# project.
 */
export class RunProjectCommand implements BaseFileCommand {
    async run(path: string): Promise<void> {
        TerminalUtilities.executeCommand(`dotnet run --project ${path}`);
    }
}