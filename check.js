const express=require("express");
const app=express(); 
const database=require("better-sqlite3");
const db=new database("uptime.db");
db.exec(`
    CREATE TABLE IF NOT EXISTS checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        status TEXT,
        timestamp TEXT
    )
`);
const insert = db.prepare("INSERT INTO checks (url, status, timestamp) VALUES (?, ?, ?)");


app.get("/status",(req,res)=>{
    res.json(stats)
});

app.listen(3000,()=>{
    console.log("Server started on http://localhost:3000")
});

const fs= require("fs");
const stats={
   up:0,
   down:0,
   sites:{},
};
async function checkSite(url) {
    try{
        const response=await fetch(url);
        let message;
        if(response.status===200){
            stats.up++;
            stats.sites[url]="up";
            message=url+ " Site is up " + "response- " +response.status;
            insert.run(url, "up", new Date().toISOString());
        }
        else{
            stats.down++;
            stats.sites[url]="down";
            message=url+ " Site is down " + "response- " +response.status;
            insert.run(url, "down", new Date().toISOString());
            fs.appendFileSync("alert.txt",message+"\n");
        }
        console.log(message);
        fs.appendFileSync("status.txt", message + "\n");
    }
    catch(error){
        const message= url +" Site is down"+ "response-" + error.message;
        stats.down++;
        stats.sites[url]="down";
        insert.run(url, "down", new Date().toISOString());
        console.log(message);
        fs.appendFileSync("alert.txt",message+"\n");
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

async function checkAllSites(sites){
    for(const site of sites){
        await checkSite(site);
    }
    const uptimePercent=(stats.up/(stats.up+stats.down))*100;
    console.log("Uptime so far-" + uptimePercent.toFixed(2) +"%");
}

function myTask(){
    checkAllSites(sites);
}

setInterval(myTask,10000);


