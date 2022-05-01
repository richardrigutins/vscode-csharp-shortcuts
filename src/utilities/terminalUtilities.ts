import * as vscode from 'vscode';

export module TerminalUtilities {
    /**
     * Opens a terminal and execute the command.
     * @param command The command to execute
     * @param args An optional array of arguments to pass to the command
     */
    export function executeCommand(command: string, args?: string[]): void {
        const terminal = getTerminal();

        if (args && args.length > 0) {
            command += ` ${args.join(' ')}`;
        }

        terminal.show();
        terminal.sendText(command);
    }

    /**
     * Gets the terminal if it exists, otherwise creates it
     * @returns The terminal
     */
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
