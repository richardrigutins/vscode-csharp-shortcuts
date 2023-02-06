import { BaseFileCommand } from ".";
import { executeDotnetCommand } from "../utilities/executeCommand";

export class CleanCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		executeDotnetCommand(['clean', `"${path}"`]);
	}
}
