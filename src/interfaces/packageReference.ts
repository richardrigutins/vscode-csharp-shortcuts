/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Maps the PackageReference element of a csproj file to a JSON object.
 */
export interface PackageReference {
	Include: string;
	Version: string;
}
