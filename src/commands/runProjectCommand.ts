import { BaseFileCommand } from ".";
import { executeCommand } from "../utilities/executeCommand";

/**
 * Executes the command to run the selected C# project.
 */
export class RunProjectCommand implements BaseFileCommand {
    async run(path: string): Promise<void> {
        executeCommand(`dotnet run --project "${path}"`);
    }
}