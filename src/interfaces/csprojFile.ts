/* eslint-disable @typescript-eslint/naming-convention */

import { Project } from "./project";

/**
* Maps the structure of a csproj file to a JSON object.
*/
export interface CsprojFile {
    Project: Project;
}
