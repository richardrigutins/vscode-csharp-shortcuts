import { NugetSearchResultItem } from ".";

export interface NugetSearchResult {
    totalHits: number;
    data: NugetSearchResultItem[];
}
