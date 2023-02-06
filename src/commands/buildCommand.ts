import { BaseFileCommand } from ".";
import { executeDotnetCommand } from "../utilities/executeCommand";

export class BuildCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		executeDotnetCommand(['build', `"${path}"`]);
	}
}
