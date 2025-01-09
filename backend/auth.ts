export async function verify(access: string): Promise<string | null> {
    const url = 'https://api.minecraftservices.com/minecraft/profile';

    const response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + access
        },
    });

    if (response.status !== 200) {
        return null;
    }
    
    return (await response.json()).id;
}