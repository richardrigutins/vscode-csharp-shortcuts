import * as vscode from 'vscode';

export class TerminalService {
	private readonly terminalName = 'dotnet';

	public executeCommand(command: string, args?: string[]): void {
		const terminal = this.getTerminal();

		if (args && args.length > 0) {
			command += ` ${args.join(' ')}`;
		}

		terminal.show();
		terminal.sendText(command);
	}

	private getTerminal(): vscode.Terminal {
		let terminal: vscode.Terminal | undefined = vscode.window.terminals.find(t => t.name === this.terminalName);
		if (!terminal) {
			const terminalOptions: vscode.TerminalOptions = {
				name: this.terminalName,
			};

			terminal = vscode.window.createTerminal(terminalOptions);
		}

		return terminal;
	}
}