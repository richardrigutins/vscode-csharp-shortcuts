import { NugetSearchResultItemVersion } from ".";

export interface NugetSearchResultItem {
	id: string;
	version: string;
	description: string;
	summary: string;
	title: string;
	iconUrl: string;
	licenseUrl: string;
	projectUrl: string;
	tags: string[];
	authors: string[];
	owners: string[];
	totalDownloads: number;
	verified: boolean;
	versions: NugetSearchResultItemVersion[];
}
