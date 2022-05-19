import * as os from 'os';

export module OsUtilities {
    /**
     * Determines whether the current OS is Windows.
     */
    export function isWindows(): boolean {
        const platform = os.platform();
        const isWindows = platform === 'win32';

        return isWindows;
    }

    /**
     * Gets the home directory of the current user.
     */
    export function getHomeDirectory(): string {
        return os.homedir();
    }

    /**
     * Returns the AppData directory path for the current user.
     * @returns 
     */
    export function getAppDataFolder(): string {
        let result: string | undefined;
        if (isWindows()) {
            result = process.env.APPDATA;
        }

        return result ?? '';
    }
}