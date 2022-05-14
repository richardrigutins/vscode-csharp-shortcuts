/**
 * Base interface for commands executed on a file.
 */
export interface BaseFileCommand {
    /**
     * Runs the command on the specified file.
     * @param filePath The absolute path to the file
     */
    run(filePath: string): void;
}