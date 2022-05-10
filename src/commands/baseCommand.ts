export interface BaseCommand {
    run(filePath: string): void;
}