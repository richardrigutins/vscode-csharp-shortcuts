/* eslint-disable @typescript-eslint/naming-convention */

import { Item } from ".";

/**
 * Maps the Project element of a csproj file to a JSON object.
 */
export interface Project {
    ItemGroup: Item[];
}
