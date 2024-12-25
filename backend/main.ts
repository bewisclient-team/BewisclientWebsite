import * as mod from "https://deno.land/std@0.217.0/http/file_server.ts";

const kv = await Deno.openKv()

if (!(await kv.get(["TIME"])).value && Number((await kv.get(["TIME"])).value) - new Date().getTime() <= 0) {
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
    }
}

const ID = "d1c5e494-2c56-429a-8eb6-ff049a928af8"

let reloadTime = 0

const MIN_API_LEVEL = 1

type response = { minimum_api_level: number, data: result }
type money = { value: number, currency: string }
type avatar = { width: string, height: string, src: string, alt: string }
type cause = { name: string, description: string, short_description: string, avatar: avatar, email: string, website: string }
type result = { goal: money; published_at: string; id: string; name: string; description: string; url: string; cause: cause; slug: string; avatar: avatar; amount_raised: money; donate_url: string; }

let result: result

async function reloadResult(id: string) {
    try {
        if (reloadTime + 600000 > new Date().getTime()) return

        reloadTime = new Date().getTime()

        const res = (await (await fetch("https://v5api.tiltify.com/api/public/campaigns/" + id, {
            headers: {
                Authorization: "Bearer " + (await kv.get(["ACCESS"])).value
            }
        })).json()).data

        const cause = (await (await fetch("https://v5api.tiltify.com/api/public/causes/" + res.cause_id, {
            headers: {
                Authorization: "Bearer " + (await kv.get(["ACCESS"])).value
            }
        })).json()).data

        result = {
            goal: res.goal,
            published_at: res.published_at,
            id: res.id,
            name: res.name,
            description: res.description,
            url: res.url,
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

        const response: response = { minimum_api_level: MIN_API_LEVEL, data: result }

        return new Response(JSON.stringify(response))
    } if (req.method != "GET")
        return new Response(null, {
            headers: {
                Allow: "GET"
            },
            status: 405,
            statusText: "Method Not Allowed"
        })
    return mod.serveDir(req, { fsRoot: "./dist" })
})