const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const app = express();
const StatsD = require("node-statsd");
const webpack = require("webpack");
const webpackConfig = require("../webpack.config");
const compiler = webpack(webpackConfig);

const port = 3000;

const client = new StatsD({
  host: "127.0.0.1",
  port: 8125,
  prefix: "local."
});

app.use(cors());

app.use(
  require("webpack-dev-middleware")(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  })
);

app.use(require("webpack-hot-middleware")(compiler));

const jsonParser = bodyParser.json();

app.get("/", (req, res) => res.send("Hello World!"));

app.post("/metrics", jsonParser, (req, res) => {
  console.log(req.body);
  const {
    id,
    phase,
    actualDuration,
    baseDuration,
    commitTime,
    startTime
  } = req.body;
  client.increment(`${id}.renders`);
  client.timing(`response_time.${id}.actual`, actualDuration);
  client.timing(`response_time.${id}.base`, baseDuration);
  client.timing(`response_time.${id}.diff`, commitTime - startTime);
  res.sendStatus(200);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
