const Discord = require("discord.js");
const { prefix, owner_id, token, webtoken, main_serverid, main_channelid } = require("./config.json");
const fs = require("fs");
const WS = require("./websocket/websocket");
const logger = require("./websocket/logs/logger");

const client = new Discord.Client();

const ws = new WS(webtoken, 6969, client);

let now = Date.now();
let date_zenbu = new Date(now);
let date = date_zenbu.getDate();
let month = date_zenbu.getMonth();
let year = date_zenbu.getFullYear();
let time = date_zenbu.getTime();

client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.login(token);

client.once("ready", () => {
  new logger(1, "Ready!");
  client.guilds.cache.get(main_serverid).channels.cache.get(main_channelid).send("Saber-chan online!")
});

client.on("message", (message) => {
  // new logger(0, message.member.id);

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(" ");
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  if (command.guildOnly && message.channel.type !== "text") {
    return message.channel.send(
      "Sorry, I can't execute that command inside DMs :("
    );
  }

  if (command.ownerOnly && message.author.id !== owner_id) {
    return message.channel.send("Sorry, this command is owner only :(");
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  try {
    command.execute(message, args);

    fs.appendFile("./websocket/public/logs.txt", `${date}.${month}.${year} ${time}: ${message}\n`, (err) => {
      if (err) {
        new logger(3, err);
        return;
      }
    });
  } catch (error) {
    new logger(3, err);
    message.reply(
      "Sorry, there was an error trying to execute that command\nPlease try again later or contact vme"
    );
  }
});
