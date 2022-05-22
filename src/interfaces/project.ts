/* eslint-disable @typescript-eslint/naming-convention */

import { Item, PropertyGroup } from ".";

/**
 * Maps the Project element of a csproj file to a JSON object.
 */
export interface Project {
    ItemGroup: Item[];
	PropertyGroup: PropertyGroup;
}
