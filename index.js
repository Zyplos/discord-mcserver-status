const Discord = require("discord.js");
const client = new Discord.Client();
const request = require("snekfetch");
/*
    Set this to your Bot's token.
*/
const botToken = "";

const command = "zy;mc";
/*
    Set this to your server ip. Doesn't need a port.
*/
const ip = "";

var data;
var cachedTimestamp;
var errorTries = 0;

function pingServer() {
    request.get("https://api.mcsrvstat.us/1/" + ip)
        .then(requestData => {
            data = requestData.body;
            cachedTimestamp = new Date();
            errorTries = 0;

            var status;
            var textStatus;
            var statusType;

            if (data.offline) {
                status = "dnd";
                textStatus = "Server Offline";
                statusType = "PLAYING";
            } else {
                statusType = "WATCHING";
                if (data.players.online == 0) {
                    status = "idle";
                    textStatus = "0 players of " + data.players.max + " | Online";
                } else {
                    status = "online";
                    textStatus = data.players.online + " players of " + data.players.max + " | Online";
                }
            }

            client.user.setPresence({
                game: {
                    name: textStatus,
                    type: statusType
                },
                status: status
            }).then(() => {
                console.log("[" + cachedTimestamp.toLocaleTimeString() + "] Updated: " + textStatus);
            });

        }).catch(errorData => {
            console.log("[discord-mcserver-status] An error occurred while trying to get the server's status.");
            console.log(errorData);
            errorTries++;
            if (errorTries > 10) {
                console.log("[discord-mcserver-status] Too many errors have occurred, shutting down. Please look at the index.js file and make sure the IP is right, or that any edited code is correct.");
            }
        });
}

client.on("ready", () => {
    console.log("[discord-mcserver-status] Loaded!");

    if (!ip || !command) {
        console.log("[discord-mcserver-status] Hey, you're missing some stuff.");
        if (!ip) {
            console.log("[discord-mcserver-status] You forgot to set the IP.");
        }
        if (!command) {
            console.log("[discord-mcserver-status] There isn't a command set for the bot.");
        }
        process.exit(1);
    }

    console.log("[discord-mcserver-status] Pinging server...");

    pingServer();
    client.setInterval(pingServer, 30000);
});

client.on("message", msg => {
    if (msg.content === command) {

        if(!data){
            msg.channel.send("Currently pinging the server, try again in a bit.");
            return;
        }

        if ("offline" in data) {
            msg.channel.send("The server is currently offline.");
            return;
        }

        var embed = {
            "embed": {
                "title": "__Minecraft Server Status__",
                "description": "The server is currently online with " + data.players.online + " players.",
                "color": 640512,
                "footer": {
                    "text": ip + " • Last updated"
                },
                //"timestamp": new Date(globalResponse.data.last_updated * 1000),
                "timestamp": cachedTimestamp
            }
        };

        if (data.players.online > 0) {
            var playerList = "";

            for(var i = 0; i < data.players.list.length; i++){
                playerList += (data.players.list[i] + "\n");
            }

            embed.embed.fields = [{
                "name": "Online Players",
                "value": playerList
            }];
        }

        msg.channel.send(embed);
    }
});

client.login(botToken);