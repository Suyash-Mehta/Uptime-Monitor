# SRE Uptime Monitor

A Node.js script that monitors website uptime — checks multiple sites at a time, sends an alert if a website is down, tells us the uptime %, exposes a live status API, and stores site status data in SQLite.

## Features

- Checks the status of all sites every 10 seconds
- All data on whether a site is up/down is stored in `status.txt` using Node.js's built-in file system module (`fs`)
- If a site is down, an alert message is logged in `alert.txt`
- Live status viewable in the browser — shows how many sites are up/down in total, with per-site status
- Persists all historical checks in a SQLite database (`uptime.db`)

## Tech Stack

- Node.js
- Express (for the status API)
- better-sqlite3 (for persistence)

## What I Learned

- First, I learned about `async`/`await`, which tells the program to wait for a process to complete before moving forward. In this case, it was waiting until we got a response from the site we wanted to fetch.
- Next, I learned that if `fetch(url)` fails, it would crash the whole program, which we don't want — so we use a `try`/`catch` block to handle that gracefully.
- Then I learned about Node.js's built-in file system module, accessed using `require("fs")`, for reading and writing log files.
- I learned about nested objects, how to use methods, and various object-related functions used in different situations, like `.get()`, `.listen()`, `.run()`, etc.
- I discovered we can install the Express library using `npm install express`, which makes building a server much easier, since we don't have to manually write server-handling code.
- More importantly, I learned how communication between the browser, the program, and the server takes place (requests and responses).
- I learned about `setInterval`, which lets us repeat a set of instructions after a given interval of time.
- Finally, I learned about using a database to store the URL, site status, and the time each check happened. For this, I used `better-sqlite3`, an npm package for working with SQLite databases.

## Possible Next Steps

- Add email/webhook notifications instead of just a text file
- Build a simple frontend dashboard to visualize uptime history
- Add configurable check intervals and site list via a config file