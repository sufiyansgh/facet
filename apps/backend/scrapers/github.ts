import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

export async function scrapeGithub(username: string | null) {
    const userRepos = await axios.get(
        `https://api.github.com/users/${username}/repos`,

        {
            proxy: {
                protocol: "http",
                host: "p.webshare.io",

                port: 80,

                auth: {
                    username: process.env.WEBSHARE_USERNAME!,
                    password: process.env.WEBSHARE_PASSWORD!,
                },
            },
        },
    );

    return userRepos.data.map((x: any) => ({
        description: x.description,
        name: x.name,
        fullName: x.full_name,
        starCount: x.stargazers_count,
    }));
}
