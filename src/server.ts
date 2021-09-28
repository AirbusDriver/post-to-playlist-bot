import express from "express";
import * as settings from "@config/settings";
import {promises as fsp} from "fs";
import url from "url"
import axios from "axios";

const port = settings.server.port;
const clientId = "6976d324ef8e48289844a3462d14cdc6";
const secret = "7cbbd941814f4ceeb163ba896ef6abf7";
const CODE_FILE = "code.txt";

const scopes = [
    "playlist-modify-public",
    "playlist-modify-private"
];

const scopeString = scopes.join(" ");


const app = express();

const baseSpotUri = "https://accounts.spotify.com/authorize";
const redirUri = `http://localhost:${port}/authorized`;

app.use((req, res, next) => {
    console.log(req.headers, req.url);
    next();
});

app.get("/authorize", (req, res) => {
    res.redirect(
        `${baseSpotUri}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURI(redirUri)}` +
        `&scope=${encodeURI(scopeString)}`
    );
});

app.get("/authorized", async (req, res) => {
    const code = req.query.code as string;
    console.log(`code retrieved => ${code}`);
    res.json(req.headers);
    const fh = await fsp.open(CODE_FILE, "w");
    try {
        await fh.writeFile(code);
        console.log(`code saved to ${CODE_FILE}`);

    } finally {
        await fh.close();
    }
    res.redirect("/credentials");
});

app.get("/credentials", async (req, res) => {

    const fh = await fsp.open(CODE_FILE, "r");
    try {
        const code = await fh.readFile();

        const params = new url.URLSearchParams()



        const data: any = await axios.post(
            `https://accounts.spotify.com/api/token`,
            {
                grant_type: "authorization_code",
                code,
                redirect_uri: redirUri
            },
            {
                headers: {
                    Authorization: `Basic ` + encodeURI(`${clientId}:${secret}`)
                }
            }
        );
        console.log(data);

        res.json(data);

    } catch (e) {
        console.log(e);
    } finally {
        await fh.close();
    }

    res.json({});


});


app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
    console.log(`log in at http://localhost:${port}/authorize`);
});


