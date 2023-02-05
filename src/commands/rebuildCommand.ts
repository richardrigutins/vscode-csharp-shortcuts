import { BaseFileCommand } from ".";
import { executeCommand } from "../utilities/executeCommand";

export class RebuildCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		executeCommand(`dotnet build "${path}" --no-incremental`);
	}
}
