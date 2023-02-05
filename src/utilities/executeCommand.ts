import * as vscode from "vscode";
import * as cp from "child_process";
import { appendLineToOutputChannel, appendToOutputChannel, showOutputChannel } from "./outputChannelWrapper";

/** 
 * Executes a command as a child process and shows the output in the output channel.
 * @param cmd The command to execute.
 * @param args The arguments to pass to the command.
 * @param showChannel If true, the output channel will be shown.
 * @param showProgress If true, a progress notification will be shown while the command is executing.
 */
export function executeCommand(
    cmd: string,
    args: string[] = [],
    showChannel: boolean = true,
    showProgress: boolean = true,
): void {
    let command = buildCommand(cmd, args);

    var childProcess = cp.exec(command, {
        env: process.env
    });

    if (showChannel) {
        showOutputChannel();
    }

    if (showProgress) {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Executing command '${command}'...`,
        }, () => new Promise<void>((resolve) => {
            childProcess.on("exit", (code) => {
                if (code !== 0) {
                    vscode.window.showErrorMessage(`Command '${command}' exited with code ${code}`);
                }
                resolve();
            });
        }));
    }

    appendLineToOutputChannel("-----------------------------------------------");
    appendLineToOutputChannel(command);
    appendLineToOutputChannel("-----------------------------------------------");

    childProcess.stderr?.on("data", (data: string) => {
        appendToOutputChannel(data);
        vscode.window.showErrorMessage(data);
    });
    childProcess.stdout?.on("data", (data: string) => {
        appendToOutputChannel(data);
    });
}

function buildCommand(cmd: string, args: string[]) {
    let command = cmd;
    if (args && args.length > 0) {
        command += ` ${args.join(" ")}`;
    }

    return command;
}
