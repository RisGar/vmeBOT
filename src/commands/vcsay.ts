import request from "request";
import http from "http";
import fs from "fs";
import logger from "../websocket/logs/logger";
import { ttstoken } from "../config.json";
import tts from "../voice-rss-tts/index";

export {};

module.exports = {
  name: "vcsay",
  description:
    "Say something in TTS powered by http://www.voicerss.org and send it to VC",
  args: true,
  execute(message, args) {
    const FileTtsRequest = new tts(message);

    const playFile = async () => {
      const vc = await message.member.voice.channel.join();

      const dispatcher = vc.play("http://localhost:8081/");

      dispatcher.on("finish", () => {
        const sayingMsginVCWsLogger = new logger(
          1,
          `Saying "${message}" in channel "${message.member.voice.channel.name}" (Websocket)`
        );
        vc.disconnect();

        const { fileServer } = FileTtsRequest;

        http.get("http://localhost:8081/", () => {
          fileServer.close();
        });
      });
    };

    playFile();
  },
};
