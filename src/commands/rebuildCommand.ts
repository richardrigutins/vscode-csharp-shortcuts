import * as TerminalUtilities from "../utilities/terminalUtilities";
import { BaseFileCommand } from ".";

export class RebuildCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		TerminalUtilities.executeCommand(`dotnet build ${path} --no-incremental`);
	}
}
