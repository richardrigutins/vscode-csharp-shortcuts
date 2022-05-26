import * as TerminalUtilities from "../utilities/terminalUtilities";
import { BaseFileCommand } from ".";

export class BuildCommand implements BaseFileCommand {
	async run(path: string): Promise<void> {
		TerminalUtilities.executeCommand(`dotnet build ${path}`);
	}
}