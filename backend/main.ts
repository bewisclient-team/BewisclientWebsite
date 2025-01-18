import * as mod from "https://deno.land/std@0.217.0/http/file_server.ts";
import { getOnLaunchArguments, loadCosmeticData, loadSpecialData, loadUserData, returnSpecials } from "./cape.ts";

export const kv = await Deno.openKv()

let cosmetic_data = await loadCosmeticData()
let special_data = await loadSpecialData()

let token_time = (await kv.get(["TIME"])).value
let access_token = (await kv.get(["ACCESS"])).value

export const user_data: { [x: string]: { hat: string, cape: string, wing: string } }
    = (await loadUserData()).reduce((a: { [x: string]: { hat: string, cape: string, wing: string } }, v: { uuid: string, hat: string, cape: string, wing: string }) => ({
        ...a, [v.uuid]: {
            cape: v.cape,
            wing: v.wing,
            hat: v.hat
        }
    }), {})

let lastDataLoadingTime = new Date().getTime()

async function checkExpiredData() {
    if (lastDataLoadingTime + 600000 < new Date().getTime()) {
        cosmetic_data = await loadCosmeticData()
        special_data = await loadSpecialData()

        lastDataLoadingTime = new Date().getTime()
    }
}

export async function getCosmeticData() {
    await checkExpiredData()

    return cosmetic_data
}

export async function getSpecialData(uuid: string) {
    await checkExpiredData()

    return special_data.filter((item: { uuid: string }) => item.uuid == uuid)
}

async function refresh_token() {
    const formdata = new FormData()

    formdata.append("client_id", Deno.env.get("ID")!)
    formdata.append("client_secret", Deno.env.get("SECRET")!)
    formdata.append("refresh_token", String(((await kv.get(["REFRESH"])).value) ?? Deno.env.get("ORIGINAL_REFRESH")))
    formdata.append("grant_type", "refresh_token");

    const a = (await (await fetch("https://v5api.tiltify.com/oauth/token", {
        method: "POST",
        body: formdata
    })).json())

    console.log("ACCESS TOKEN REFRESHED: " + JSON.stringify(a));

    if (a.refresh_token) {
        kv.set(["REFRESH"], a.refresh_token)
        kv.set(["ACCESS"], a.access_token)
        kv.set(["TIME"], new Date(a.created_at).getTime() + a.expires_in * 1000)

        access_token = a.access_token
        token_time = new Date(a.created_at).getTime() + a.expires_in * 1000
    }
}

await refresh_token()

const ID = "d1c5e494-2c56-429a-8eb6-ff049a928af8"

let reloadTime = 0

const MIN_API_LEVEL = 1

type response = { minimum_api_level: number, data: result }
type money = { value: number, currency: string }
type avatar = { width: string, height: string, src: string, alt: string }
type cause = { name: string, description: string, short_description: string, avatar: avatar, email: string, website: string }
type result = { goal: money; published_at: string; id: string; name: string; description: string; url: string; cause: cause; slug: string; avatar: avatar; amount_raised: money; donate_url: string; }

let tiltify_res: result

async function reloadResult(id: string) {
    try {
        if (!token_time && Number(token_time) - new Date().getTime() <= 0) {
            refresh_token()
        }

        if (reloadTime + 600000 > new Date().getTime()) return

        reloadTime = new Date().getTime()

        const res = (await (await fetch("https://v5api.tiltify.com/api/public/campaigns/" + id, {
            headers: {
                Authorization: "Bearer " + access_token
            }
        })).json()).data

        const cause = (await (await fetch("https://v5api.tiltify.com/api/public/causes/" + res.cause_id, {
            headers: {
                Authorization: "Bearer " + access_token
            }
        })).json()).data

        tiltify_res = {
            goal: res.goal,
            published_at: res.published_at,
            id: res.id,
            name: res.name,
            description: res.description,
            url: "https://tiltify.com" + res.url,
            cause: {
                name: cause.name,
                description: cause.description,
                short_description: cause.short_description,
                email: cause.contact.email,
                avatar: cause.avatar,
                website: cause.social.website
            },
            slug: res.slug,
            avatar: res.avatar,
            amount_raised: res.amount_raised,
            donate_url: res.donate_url
        }
    } catch (e) {
        console.log(e);
    }
}

await reloadResult(ID)

Deno.serve(async (req) => {
    if (req.method == "GET" && new URL(req.url).pathname == "/api/donations") {
        await reloadResult(ID)

        const response: response = { minimum_api_level: MIN_API_LEVEL, data: tiltify_res }

        return new Response(JSON.stringify(response))
    } else if (req.method == "POST" && new URL(req.url).pathname == "/api/on_launch") {
        return await getOnLaunchArguments(req)
    } else if (req.method == "POST" && new URL(req.url).pathname == "/api/specials") {
        return await returnSpecials(req)
    } else if (req.method == "POST" && new URL(req.url).pathname == "/api/cape") {
        return new Response(null, { status: 501, statusText: "Not Implemented" });
        // return await setCosmetic(req)
    } else if (req.method != "GET")
        return new Response(null, {
            headers: {
                Allow: "GET"
            },
            status: 405,
            statusText: "Method Not Allowed"
        })
    return mod.serveDir(req, { fsRoot: "./dist" })
})