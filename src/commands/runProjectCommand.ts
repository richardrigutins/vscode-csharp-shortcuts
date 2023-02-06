import { BaseFileCommand } from ".";
import { executeDotnetCommand } from "../utilities/executeCommand";

/**
 * Executes the command to run the selected C# project.
 */
export class RunProjectCommand implements BaseFileCommand {
    async run(path: string): Promise<void> {
        executeDotnetCommand(['run', '--project', `"${path}"`]);
    }
}
