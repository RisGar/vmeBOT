const path = require("path");
const express = require("express");
const hbs = require("express-handlebars");
const bodyParser = require("body-parser");
const logger = require("./logs/logger");

class WebSocket {
  constructor(token, port, client) {
    this.token = token;
    this.port = port;
    this.client = client;

    this.app = express();

    this.app.engine(
      "hbs",
      hbs({
        extname: "hbs",
        defaultLayout: "layout",
        layoutsDir: __dirname + "/layouts",
      })
    );
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "hbs");
    this.app.use(express.static(path.join(__dirname, "public")));
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.registerRoots();

    this.server = this.app.listen(port, () => {
      new logger(1, `Port: ${this.server.address().port}`);
    });
  }

  checkToken(_token) {
    return _token == this.token;
  }

  registerRoots() {
    this.app.get("/", (req, res) => {
      const _token = req.query.token;

      if (!this.checkToken(_token)) {
        res.render("enter_token", {
          title: "Saber-chan Webinterface: Enter Token",
        });
        return;
      }

      let chans = [];

      this.client.guilds.cache.forEach((c) => {
        chans.push({ id: "Server", name: `**${c.name}**` });
        c.channels.cache
          .filter((c) => c.type == "text")
          .forEach((c) => {
            chans.push({ id: c.id, name: c.name });
          });
      });

      // new logger(1, chans);

      res.render("index", {
        title: "Saber-chan Webinterface",
        token: _token,
        chans,
      });
    });

    this.app.post("/sendMessage", (req, res) => {
      const _token = req.body.token;
      const text = req.body.text;
      const channelid = req.body.channelid;

      if (!_token || !channelid || !text) {
        new logger(3, "No token, channelid or text");
        return res.sendStatus(400);
      }

      if (channelid == "Server") {
        new logger(3, "Cannot send message to server");
        return res.sendStatus(400);
      }

      if (!this.checkToken(_token)) {
        res.render("error", {
          title: "Saber-chan Webinterface ERROR",
          errtype: "Invalid Token",
        });
        return;
      }

      // new logger(1, channelid);

      let chanids = [];

      this.client.guilds.cache.forEach((c) => {
        c.channels.cache
          .filter((c) => c.type == "text")
          .forEach((c) => {
            chanids.push(c);
          });
      });

      // new logger(1, chanids);

      let chanArray = chanids.filter((o) => {
        return o.id == channelid;
      });

      // new logger(1, chanArray);

      let chan = chanArray[0];

      // new logger(1, chan);

      new logger(1, `Sending message "${text}" to the channel "${chan.name}" (Websocket)`);

      if (chan) {
        chan.send(text);
        res.sendStatus(200);
      } else {
        res.sendStatus(406);
      }
    });
  }
}

module.exports = WebSocket;
