import * as TerminalUtilities from "../utilities/terminalUtilities";
import { BaseFileCommand } from ".";

export class BuildProjectCommand implements BaseFileCommand {
	async run(csprojPath: string): Promise<void> {
		TerminalUtilities.executeCommand(`dotnet build ${csprojPath}`);
	}
}