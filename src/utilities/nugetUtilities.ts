import * as axios from 'axios';
import { NugetSearchResult, NugetSearchResultItem } from "../interfaces";

export module NugetUtilities {
    export async function searchNugetPackages(searchText: string, prerelease: boolean): Promise<NugetSearchResultItem[]> {
        const pageSize = 20;
        const nugetEndpoint = `https://azuresearch-usnc.nuget.org/query?q=${searchText}&prerelease=${prerelease}&take=${pageSize}`;
        return axios.default
            .get<NugetSearchResult>(nugetEndpoint)
            .then(res => {
                console.log(`statusCode: ${res.status}`);
                console.log(res.data.data.map(item => item.id));
                return res.data.data;
            })
            .catch(error => {
                console.error(error);
                let result: NugetSearchResultItem[] = [];
                return result;
            });
    }
}