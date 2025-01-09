import { verify } from "./auth.ts";
import { supabase } from "./database.ts";

export async function setCosmetic(req: Request) {
    const access = req.headers.get("Authorization")?.split(" ")[1]

    if(!access) return new Response(null, {
        status: 401,
        statusText: "Unauthorized"
    })

    const uuid = await verify(access)

    if(!uuid) return new Response(null, {
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

    return new Response(null, {
        status: 201,
        statusText: "Created"
    });
}

export async function returnSpecials(req: Request) {
    const uuid = (await req.json()).uuid

    const { data, error } = await supabase.from('specials').select('type, name').eq('uuid', uuid)

    console.log(data, error);
    
    if (error) return new Response(null, {
        status: 500,
        statusText: "Internal Server Error"
    });

    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: "OK"
    });
}