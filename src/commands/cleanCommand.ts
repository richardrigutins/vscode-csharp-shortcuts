import { BaseFileCommand } from ".";
import { executeCommand } from "../utilities/executeCommand";

export class CleanCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		executeCommand(`dotnet clean "${path}"`);
	}
}
