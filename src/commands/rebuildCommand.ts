import { BaseFileCommand } from ".";
import { executeDotnetCommand } from "../utilities/executeCommand";

export class RebuildCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		executeDotnetCommand(['build', `"${path}"`, '--no-incremental']);
	}
}
