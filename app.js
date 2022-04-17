const express = require("express");
const path = require("path");
const fs = require("fs");
const randomFile = require('select-random-file')
const { finished, Stream } = require('stream');
const app = express();

var Jetty = require("jetty");
var jetty = new Jetty(process.stdout);


const Throttle = require('throttle');
const { ffprobeSync } = require('@dropb/ffprobe');
const { resolve } = require("path");



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));



class Player {

    constructor() {
        this.queueLength = 10;
        this.queue = [];
        this.listeners = [];
        this.bitRate = 0;
        this.liveStream = undefined;
        this.throttledStream = undefined;
    }

    addListener(listener) {
        this.listeners.push(listener)
    }

    removeDuplicateListeners() {
        let activeListeners = [];
        let toIterate = this.listeners.slice().reverse();
        for (listener of toIterate) {
            let IPexists = false;
            for (activeListener of activeListeners) {
                if (listener.ip == activeListener.ip) {
                    IPexists = true;
                    break;
                }
            }
            if (!IPexists) {
                activeListeners.push(listener);
            }
        }
        this.listeners = activeListeners;
    }

    addToQueue(song) {
        this.queue.push(song);
    }

    getFromQueue() {
        return this.queue.shift();
    }

    getRandomSong() {
        return new Promise((resolve, reject) => {
            randomFile("songs", (err, file) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve("songs/" + file);
                }
            });
        });
    }

    async generateQueue() {

        while (this.queue.length < this.queueLength) {
            const songToAdd = await this.getRandomSong();
            if (this.queue.includes(songToAdd)) {
                continue;
            }
            this.addToQueue(songToAdd);
        }

    }

    async playSong() {
        return new Promise((resolve, reject) => {
            console.log(this.queue);
            const file = this.getFromQueue();
            this.bitRate = ffprobeSync(file).format.bit_rate;
            this.liveStream = fs.createReadStream(file);
            this.throttledStream = new Throttle(this.bitRate / 8);

            this.liveStream.pipe(this.throttledStream).on('data', (chunk) => {
                this.listeners.forEach(listener => {
                    listener.res.write(chunk);
                });
            }).on('end', () => {
                resolve(true);
            });
        })

    }

    async startPlayback() {
        await this.generateQueue();
        while (true) {
            if (this.queue.length <= 1) {
                await this.generateQueue();
            }
            await this.playSong();
        }
    }
}


const player = new Player();
player.startPlayback();

app.listen(8080, err => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Server Online");
    }
});

app.get("/", (req, res) => {
    res.render("index.ejs");
});


app.get("/stream", (req, res) => {
    player.addListener({ ip: req.ip, res });
})
