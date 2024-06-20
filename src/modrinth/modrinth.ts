import { versionSetter } from "../pages/Home";

export let versions: any = {}

const url = "https://api.modrinth.com/v2/project/bewisclient/version"

export let newest_versions = {
    beta: {} as any,
    release: {} as any
};

(async () => {
    let response = await fetch(url);
    versions = await response.json();

    for (let i = versions.length-1; i > -1; i--) {
        const element = versions[i];
        
        if(element.version_type==="beta"){
            newest_versions.beta = element

            versionSetter.beta(element)
        }
        if(element.version_type==="release"){
            newest_versions.release = element

            versionSetter.release(element)
        }
    }
})()