import logger from "../websocket/logs/logger";

export {};

module.exports = {
  name: "beep",
  description: "Beep!",
  args: false,
  execute(message) {
    message.channel.send("Boop!");
  },
};
