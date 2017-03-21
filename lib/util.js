/////////////////////////////////////
// utility
const md5 = require('md5')

const util = {};

// オプションのチェック
util.checkOpts_ = function(opts_) {
  var opts = {};

  // key check (なかったら throw)
  if(!opts_.key || typeof(opts_.key) !== "string") {
    throw "app key must be specified";
  };

  // key check ( string patter がマッチしなかったら throw )
  if(!opts_.key.match(/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/)) {
    throw "wrong string pattern of app key";
  };
  // copy key
  opts.key = opts_.key;

  // todo : room prefix にdomainを意識したほげほげ
  // room check (なかったら "")
  if(!opts_.room || typeof(opts_.room) !== "string") {
    var seed = "";
  } else if(!opts_.room.match(/^[0-9a-zA-Z\-\_]{4,32}$/)){
    throw "room name should be digit|alphabet and length between 4 and 32";
  } else {
    var seed = opts_.room
  };

  opts.room_name = seed;

  opts.room_id = util.makeRoomName(seed);

  // id check (なかったら生成）

  var hash_ = location.pathname + "_" + opts.room_id + "_peer_id";
  if(!!sessionStorage[hash_]) {
    opts.id = sessionStorage[hash_];
  } else if(!opts_.id || typeof(opts_.id) !== "string") {
    opts.id = opts.room_id + util.makeID();
  } else {
    opts.id = opts.room_id + opts_.id;
  }
  sessionStorage[hash_] = opts.id;

  // reliable check (なかったら false)
  if(!opts_.reliable) {
    opts.reliable = false;
  } else {
    opts.reliable = true;
  }

  // serialization check (未指定なら binary)
  if(!opts_.serialization) {
    opts.serialization = "binary";
  } else {
    // serializationのタイプをチェックする
    // binary, utf-8, json以外はエラー
    opts.serialization = opts_.serialization;
  }

  // stream check
  opts.video_stream = (opts_.video === undefined ? true : opts_.video);
  opts.audio_stream = (opts_.audio === undefined ? true : opts_.audio);
  opts.use_stream = opts.video_stream || opts.audio_stream;

  // polling disconnect/reconnect (must for FF)
  opts.polling = (opts_.polling === undefined ? true : opts_.polling);
  opts.polling_interval = (opts_.polling_interval === undefined ? 3000 : opts_.polling_interval);

  // peerjs options
  opts.peerjs_opts = {
    debug: opts_.debug || false,
    key: opts.key
  };
  if(opts_.host){
    opts.peerjs_opts.host = opts_.host;
  }
  if(opts_.port){
      opts.peerjs_opts.port = opts_.port;
  }
  if(opts_.secure){
    opts.peerjs_opts.secure = opts_.secure;
  }
  if(opts_.config){
    opts.peerjs_opts.config = opts_.config;
  }

  return opts;
}



// IDを作る
util.makeID = function() {
  var id = "";

  for (var i = 0; i < 32; i++) {
    // id += String.fromCharCode( (Math.random() * (125 - 33) + 33) | 0)
    id += String.fromCharCode( (Math.random() * (57 - 48) + 48) | 0)
  }
  return id;
}

// room名を作る
util.makeRoomName = function(seed) {
    seed = seed || "";
    seed += location.host + location.pathname;
    return md5(seed).substring(0,6) + "R_";
}

// video nodeを作る
util.createVideoNode = function(video) {
  // 古いノードが会った場合は削除
  var prev_node = document.getElementById(video.id);
  if(prev_node) prev_node.parentNode.removeChild(prev_node);

  // 表示用のビデオノードを作る
  var v_ = document.createElement("video");
  v_.setAttribute("src", video.src);
  v_.setAttribute("id", video.id);

  var played = false;

  v_.addEventListener("loadedmetadata", function(ev) {
    if(!played) {
      played = true;
      this.play();
    }
  }, false);

  // since FF37 sometimes doesn't fire "loadedmetadata"
  // work around is after 500msec, calling play();
  setTimeout(function(ev){
    if(!played) {
      played = true;
      v_.play();
    }
  }, 500);

  return v_;
}


module.exports = util
