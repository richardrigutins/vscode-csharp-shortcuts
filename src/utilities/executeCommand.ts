import * as vscode from "vscode";
import * as cp from "child_process";
import { appendLineToOutputChannel, appendToOutputChannel, showOutputChannel } from "./outputChannelWrapper";

let isBusy = false;

/**
 * Executes a command as a child process and shows the output in the output channel.
 * @param cmd The command to execute.
 * @param args The arguments to pass to the command.
 * @param showChannel If true, the output channel will be shown.
 * @param showProgress If true, a progress notification will be shown while the command is executing.
 * @returns A promise that resolves when the command is done executing.
 */
export function executeDotnetCommand(
    args: string[],
    showChannel: boolean = true,
    showProgress: boolean = true,
): Promise<void> {
    if (isBusy) {
        let errorMessage = `Another command is already executing.`;
        vscode.window.showErrorMessage(errorMessage);
        return Promise.reject(errorMessage);
    }

    isBusy = true;
    return new Promise<void>((resolve, reject) => {
        let command = buildCommand('dotnet', args);

        var childProcess = cp.spawn('dotnet', args, {
            env: process.env,
            shell: true,
        });

        if (showChannel) {
            showOutputChannel();
        }

        if (showProgress) {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing command '${command}'...`,
            }, () => new Promise<void>((resolve) => {
                childProcess.on('exit', resolve);
            }));
        }

        appendLineToOutputChannel("-----------------------------------------------");
        appendLineToOutputChannel(command);

        childProcess.stdout.on('data', (data: Buffer) => {
            appendToOutputChannel(data.toString());
        });

        childProcess.stderr?.on('data', (data: Buffer) => {
            reject(data.toString());
        });

        childProcess.on('exit', (code) => {
            isBusy = false;
            if (code !== 0) {
                reject(`Command '${command}' exited with code ${code}`);
            } else {
                resolve();
            }
        });
    });
}

function buildCommand(cmd: string, args: string[]) {
    let command = cmd;
    if (args && args.length > 0) {
        command += ` ${args.join(" ")}`;
    }

    return command;
}
