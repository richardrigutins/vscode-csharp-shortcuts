import * as vscode from 'vscode';

export module TerminalUtilities {
    export function executeCommand(command: string, args?: string[]): void {
        const terminal = getTerminal();

        if (args && args.length > 0) {
            command += ` ${args.join(' ')}`;
        }

        terminal.show();
        terminal.sendText(command);
    }

    function getTerminal(): vscode.Terminal {
        const terminalName = 'dotnet';

        let terminal: vscode.Terminal | undefined = vscode.window.terminals.find(t => t.name === terminalName);
        if (!terminal) {
            const terminalOptions: vscode.TerminalOptions = {
                name: terminalName,
            };

            terminal = vscode.window.createTerminal(terminalOptions);
        }

        return terminal;
    }
}
