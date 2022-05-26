import * as TerminalUtilities from "../utilities/terminalUtilities";
import { BaseFileCommand } from ".";

export class CleanCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		TerminalUtilities.executeCommand(`dotnet clean ${path}`);
	}
}
