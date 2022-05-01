/* eslint-disable @typescript-eslint/naming-convention */

import { ProjectReference } from ".";

/**
 * Maps the ItemGroup element of a csproj file to a JSON object.
 */
export interface Item {
    ProjectReference: ProjectReference[];
}
