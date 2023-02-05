import { BaseFileCommand } from ".";
import { executeCommand } from "../utilities/executeCommand";

export class BuildCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		executeCommand(`dotnet build "${path}"`);
	}
}
