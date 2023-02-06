import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel;

/**
 * Initializes the output channel.
 * @returns The output channel.
 */
export function initializeOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel("csharp-shortcuts");
    }

    return outputChannel;
}

/**
 * Shows the output channel.
 * @throws {Error} If the output channel has not been initialized.
 */
export function showOutputChannel() {
    checkChannelInitialized();
    outputChannel.show();
}

/**
 * Appends a message to the output channel.
 * @param message The message to append.
 * @throws {Error} If the output channel has not been initialized.
 */
export function appendToOutputChannel(message: string) {
    checkChannelInitialized();
     outputChannel.append(message);
}

/**
 * Appends a message and a line feed character to the output channel.
 * @param message The message to append.
 * @throws {Error} If the output channel has not been initialized.
 */
export function appendLineToOutputChannel(message: string) {
    checkChannelInitialized();
    outputChannel.appendLine(message);
}

function checkChannelInitialized() {
    if (!outputChannel) {
        throw new Error("Output channel not initialized");
    }
}
