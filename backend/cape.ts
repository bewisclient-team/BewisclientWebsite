import { encodeBase64 } from "https://deno.land/std@0.217.0/encoding/base64.ts";
import { verify } from "./auth.ts";
import { supabase } from "./database.ts";
import { getCosmeticData, getSpecialData, user_data } from "./main.ts";

export async function setCosmetic(req: Request) {
    const access = req.headers.get("Authorization")?.split(" ")[1]

    if (!access) return new Response(null, {
        status: 401,
        statusText: "Unauthorized"
    })

    const uuid = await verify(access)

    if (!uuid) return new Response(null, {
        status: 401,
        statusText: "Unauthorized"
    })

    const body = await req.json();
    const id = body.id;
    const type = body.type;

    if (!id || !type) {
        return new Response(null, {
            status: 400,
            statusText: "Bad Request"
        });
    }

    supabase.rpc('update_cosmetics', {
        uuid: uuid,
        cape: type == "cape" ? id : null,
        hat: type == "hat" ? id : null,
        wing: type == "wing" ? id : null
    })

    user_data[uuid] = {
        cape: type == "cape" ? id : user_data[uuid].cape,
        hat: type == "hat" ? id : user_data[uuid].hat,
        wing: type == "wing" ? id : user_data[uuid].wing
    }

    return new Response(null, {
        status: 201,
        statusText: "Created"
    });
}

export async function returnSpecials(req: Request) {
    const uuid = (await req.json()).uuid

    const data = await getSpecialData(uuid)

    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: "OK"
    });
}

export async function loadSpecialData() {
    const { data } = await supabase.from('specials').select('type, name, uuid')

    return data
}

export async function loadCosmeticData() {
    const { data } = await supabase.from('cosmetic_data').select('id, type, animated').eq('default', true)

    return data
}

export async function loadUserData() {
    const { data } = await supabase.from('cosmetics').select('uuid, cape, wing, hat')

    return data
}

export async function getOnLaunchArguments(req: Request) {
    const uuid = (await req.json()).uuid

    const u = Object.entries(user_data).map(async (v: [uuid: string, { hat: string; cape: string; wing: string; }]) => (
        encodeBase64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v[0])))
    ))

    const users = []

    for await (const user of u) {
        users.push(user)
    }

    const data = {
        specials: await getSpecialData(uuid),
        cosmetics: await getCosmeticData(),
        user_data: users,
        current: user_data[uuid]
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: "OK"
    });
}