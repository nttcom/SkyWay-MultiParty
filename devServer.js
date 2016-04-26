// In this repository, almost developing process is depeding on grunt framework. However, for browser example testing, https context environment is required after M47 in Chrome. To setup easy in house environment, we use webpack-dev-server as a simple internal web server.
//
// If you wanna chage port number

var webpack = require("webpack")
  , WebpackDevServer = require("webpack-dev-server")

var port_ = process.env.PORT || 8081;

var compiler = webpack({
  devServer: {
    port: port_
  }
});

var server = new WebpackDevServer(compiler, {
  contentBase: "./"
});

// server.listen(port_, "localhost", () => {});
