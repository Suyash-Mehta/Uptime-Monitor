// LIBRARY IMPORTS: require() se existing function/object le aate hain library se,
// aur const variable mein store karte hain (jaise number/string store karte hain waise hi)
const express = require("express");

// express KHUD ek function hai. Isse call kiya () se, jo ek naya "app" OBJECT deta hai.
// app object ke andar already-built methods hain: .get(), .listen()
const app = express();

const database = require("better-sqlite3");

// "database" ek CLASS hai (blueprint), isliye "new" keyword lagana zaroori hai
// new database("uptime db") -> constructor call hota hai, naya "db" OBJECT milta hai
// db object ke andar methods hain: .exec(), .prepare()
const db = new database("uptime db");

// db.exec() ek SQL command turant CHALATA hai (yahan: table banao agar exist nahi karti)
// yeh sirf TABLE ka STRUCTURE define karta hai (columns) — insert ka order yahan se nahi aata
db.exec(`
    CREATE TABLE IF NOT EXISTS checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        status TEXT,
        timestamp TEXT
    )
`);

// db.prepare() TABLE nahi banata — yeh ek "TEMPLATE/FORM" taiyar karta hai (object return karta hai)
// jisme baad mein baar baar values bhar sakte hain, bina SQL dobara likhe
// ? ? ? = placeholders, jo .run() call karte time diye gaye values se
// EXACT ORDER mein bharte hain (pehla ? = url, doosra ? = status, teesra ? = timestamp)
// insert object ke andar method hai: .run() — yeh actual INSERT karta hai (values ke saath)
const insert = db.prepare("INSERT INTO checks (url, status, timestamp) VALUES (?, ?, ?)");


// app.get(path, function) — yeh sirf ek RULE/INSTRUCTION set karta hai
// turant kuch nahi chalta yahan — jab koi browser is "/status" path pe aayega, TAB yeh function chalega
// req, res KHUD Express deta hai automatically jab request aati hai, hum inhe pass nahi karte
app.get("/status", (req, res) => {
    // res.send() sirf plain text ke liye. res.json() OBJECT ko JSON format mein convert karke bhejta hai
    res.json(stats)
});

// app.listen(port, callback) — yeh server ko ACTUALLY START karta hai
// yahi se upar wale saare app.get() rules "activate" hote hain
// iske callback mein res NAHI milta (koi request abhi nahi aayi) — sirf console.log allowed
app.listen(3000, () => {
    console.log("Server started on http://localhost:3000")
});

// fs = Node.js ka built-in "file system toolkit". Browser mein yeh access allowed nahi hota
// (security reasons), lekin Node.js environment mein allowed hai
const fs = require("fs");

// OBJECT: related data ek saath rakhne ka tareeka (jaise up/down/sites sab site-health se related hain)
// isliye alag-alag variables (upCount, downCount) ki jagah ek object mein rakha
const stats = {
    up: 0,
    down: 0,
    sites: {}   // NESTED OBJECT — khud ek khaali object hai, isme har URL ka current status store hoga
};

// ASYNC FUNCTION: is function ke andar "await" use karne ki POWER milti hai
// KYU: fetch() turant result nahi deta (network call, time lagta hai)
// await = "yahan ruk jaao jab tak result na aa jaaye, tabhi agli line chalao"
async function checkSite(url) {
    try {
        // fetch() request bhejta hai, response object deta hai jisme .status jaisi
        // PROPERTIES already stored hain (function nahi, isliye () nahi lagta)
        const response = await fetch(url);
        let message;

        if (response.status === 200) {
            stats.up++;

            // BRACKET NOTATION: stats.sites.url NAHI likh sakte (yeh literal "url" naam dhoondhega)
            // [] JS ko batata hai "pehle url VARIABLE ki value nikaalo, phir use property naam banao"
            // yahan [] object mein NAYI property "add/set" kar raha hai kyunki yeh = ke LEFT side pe hai
            // (yehi kaam "." dot bhi karta hai jab left side pe ho — [] ka koi special "add" power nahi)
            stats.sites[url] = "up";

            message = url + " Site is up " + "response- " + response.status;

            // insert.run() -> template (upar wala prepare) mein ACTUAL values bharta hai, naya row banta hai
            insert.run(url, "up", new Date().toISOString());
        }
        else {
            stats.down++;
            stats.sites[url] = "down";
            message = url + " Site is down " + "response- " + response.status;
            insert.run(url, "down", new Date().toISOString());

            // \n (backslash n) = "naya line shuru karo" ka JS instruction
            // /n (forward slash n) GALAT hota — woh sirf normal text ban jaata, koi meaning nahi
            fs.appendFileSync("alert.txt", message + "\n");
        }
        console.log(message);

        // fs.appendFileSync("file", text) — file ke END mein text jodta hai (purana delete nahi karta)
        // file exist nahi karti toh khud bana deta hai
        fs.appendFileSync("status.txt", message + "\n");
    }
    catch (error) {
        // catch SIRF tab chalta hai jab try FAIL ho jaaye (site pura down, timeout, DNS fail waghera)
        // agar site respond kar di (chahe 404/500 ho), yeh block chalega hi nahi — try mein hi rahega
        // error object yahan AUTOMATICALLY milta hai JS se (jaise function parameter), khud nahi banaya
        const message = url + " Site is down" + "response-" + error.message;
        stats.down++;
        stats.sites[url] = "down";
        insert.run(url, "down", new Date().toISOString());
        console.log(message);
        fs.appendFileSync("alert.txt", message + "\n");
        fs.appendFileSync("status.txt", message + "\n");
    }
}

const sites = [
    "https://google.com",
    "https://github.com",
    "https://youtube.com",
    "https://amazon.com",
    "https://thissitedoesnotexist12345.com"
];

// yeh function bhi "async" hai KYUNKI iske andar "await checkSite(site)" likhna hai
// await sirf async function ke ANDAR hi legal hai (is project setup mein top-level pe nahi chal sakta)
async function checkAllSites(sites) {
    // for...of: array ke har element pe ek baar chalta hai
    // IMPORTANT: poori array (sites) pass nahi karte checkSite ko, sirf CURRENT item (site) pass karte hain
    for (const site of sites) {
        // await yahan zaroori hai — warna loop saari sites EK SAATH fire kar dega, order/result mix ho jaata
        await checkSite(site);
    }
    const uptimePercent = (stats.up / (stats.up + stats.down)) * 100;

    // .toFixed(2) — lamba decimal (jaise 83.3333) ko round karke 2 decimal places tak rakhta hai
    console.log("Uptime so far-" + uptimePercent.toFixed(2) + "%");
}

// WRAPPER FUNCTION ki zaroorat: setInterval(checkAllSites, 10000) SEEDHA nahi likh sakte,
// kyunki setInterval checkAllSites() ko BINA argument (sites) diye call karega -> crash hota
// isliye ek naya function banaya jo andar SAHI argument ke saath call kare
function myTask() {
    checkAllSites(sites);
}

// setInterval(function, milliseconds) — given function ko har X ms baad REPEAT karta hai
// yeh "waiting" nahi, "repeating" hai (async/await se ALAG concept, dono saath use ho sakte hain)
// myTask ke aage () NAHI laga — kyunki function ko turant call nahi kar rahe,
// use "AS A VALUE" de rahe hain setInterval ko, taaki woh khud baad mein call kare
setInterval(myTask, 10000);