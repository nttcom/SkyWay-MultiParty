/**
 * MultiParty.js
 *
 * SkyWayで簡単にマルチパーティ接続を実現するライブラリ
 */


(function(global){

  navigator.getUserMedia_ = navigator.getUserMedia
    || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  // コンストラクタ
  var MultiParty_ = function(opts){
    this.room = null; // ルーム名
    this.id = null; // ID
    this.key = null; // app key
    this.peers = {}; // peer Objects
    this.stream = null; // my media stream
    this.video = document.createElement("video"); // my video node
    this.tracks_ = {};
    this.gainNode_;

    this.opened = false;

    // option をチェック
    // room, myid, key プロパティを割り当てる
    this.opts = MultiParty_.util.checkOpts_(opts);

    this.conn2SkyWay_();
  }

  // EventEmitterを継承する
  MultiParty_.prototype = new EventEmitter2();

  ///////////////////////////////////
  // private method


  // SkyWayサーバーに繋ぐ
  MultiParty_.prototype.conn2SkyWay_ = function() {
    var self = this;
    
    this.peer = new Peer(this.opts.id, {
      "key": this.opts.key,
      "debug": false
    });

    // SkyWayサーバーへの接続が完了したら、open イベントを起こす
    this.peer.on('open', function(id) {
      if(self.opened) {
        throw "Error : connection to SkyWay is already opened";
      } else {
        self.opened = true;
      }

      // id check
      if(id !== this.opts.id) {
        throw "Error : SkyWay returns wrong peer id for myself";
      }

      // open イベントを発火する
      this.fire_('open', id);

      // 接続中のIDを取得する
      this.getIDs_();
    }.bind(this));

    // SkyWayサーバーへの接続が失敗した場合のerror処理
    this.peer.on("error", function(err) {
      throw "Error : " + err;
    });
  }

  // 接続中のIDを取得する
  MultiParty_.prototype.getIDs_ = function() {
    var self = this;

    self.listAllPeers(function(peers){
      peers.forEach(function(peer_id){
        self.peers[peer_id] = {};
      });

      // MediaStream処理を開始する
      if(self.opts.use_stream) {
        self.startMediaStream_();
      }

      // DataChannel処理を開始する
      self.startDataChannel_();
    });
  }

  ////////////////////////////////////
  // video 処理

  // Media Stream 処理の開始
  MultiParty_.prototype.startMediaStream_ = function(){
    this.startMyStream_();
  }

  // video stream 取得開始
  MultiParty_.prototype.startMyStream_ = function() {
    var self = this;

    navigator.getUserMedia_({"video": self.opts.video_stream, "audio": self.opts.audio_stream},
      function(stream) {
        //Set up AudioContext and gain for browsers that support createMediaStreamSource properly
        //Use the regular stream directly if it doesn't.
        var audioContext = new AudioContext();
        self.gainNode_ = audioContext.createGain();
        var mic = audioContext.createMediaStreamSource(stream);
        var peer = audioContext.createMediaStreamDestination();
        if(peer.stream.addTrack) {
          mic.connect(self.gainNode_);
          self.gainNode_.connect(peer);
          if(stream.getVideoTracks()){
            peer.stream.addTrack(stream.getVideoTracks()[0]);
          }
          self.stream = peer.stream;
        } else {
          self.stream = stream;
        }
        
        if(self.opts.video_stream){
          self.tracks_.video = stream.getVideoTracks()[0];
        }
        if(self.opts.audio_stream){
          self.tracks_.audio = stream.getAudioTracks()[0];
        }
        var url = window.URL.createObjectURL(self.stream);
        self.video.setAttribute("src", url);
        self.video.setAttribute("id", "my-video");
        self.video.setAttribute("muted", true);

        self.video.addEventListener("loadedmetadata", function(ev) {
          self.fire_('my_ms', self.video);
          self.startCall_();
          setTimeout(function(ev){ self.video.play(); }, 10);
        }, false);
      }, function(err) {
        throw err;
      }
    );
  }
  
  // MediaTrackをmuteする
  MultiParty_.prototype.mute = function(opts) {
    if(opts === undefined) {
      this.tracks_.audio.enabled = false;
      this.tracks_.video.enabled = false;
      
      if(this.gainNode_ !== undefined) {
        this.gainNode_.gain.value = 0;
      }
      return;
    }
    if(opts.audio !== undefined && opts.audio === true){
      this.tracks_.audio.enabled = false;
      this.tracks_.audio.muted = true;

      if(this.gainNode_ !== undefined) {
        this.gainNode_.gain.value = 0;
      }
    }
    if(opts.video !== undefined && opts.video === true){
      this.tracks_.video.enabled = false;
    }
  };

  MultiParty_.prototype.unmute = function(opts) {
    if(opts === undefined) {
      this.tracks_.audio.enabled = true;
      this.tracks_.video.enabled = true;

      if(this.gainNode_ !== undefined) {
        this.gainNode_.gain.value = 3;
      }
      return;
    }
    if(opts.audio !== undefined && opts.audio === true){
      this.tracks_.audio.enabled = true;

      if(this.gainNode_ !== undefined) {
        this.gainNode_.gain.value = 3;
      }
    }
    if(opts.video !== undefined && opts.video === true){
      this.tracks_.video.enabled = true;
    }
  };


  // peersに対して、MediaStream callを開始する
  MultiParty_.prototype.startCall_ = function(isScreen) {
    var self = this;

    // API経由で取得したIDには、自分からcallする（caller）
    for( var peer_id in this.peers) {
      (function(self){
        if(isScreen === true) {
          if(!self.peers[peer_id].screen_sender || self.peers[peer_id].screen_sender.open) {
            var call = self.peer.call(
                peer_id,
                self.screenStream,
                {metadata:{type:'screen'}}
            );
            self.peers[peer_id].screen_sender = call;
          }
        } else {
          var call = self.peer.call(
              peer_id,
              self.stream
          );
          self.peers[peer_id].call = call;
          self.setupStreamHandler_(call);
        }
      }(self));
    };


    // 新規に接続してきたpeerからのcallを受け付けるハンドラ
    if(!this.peer._events.call || this.peer._events.call.length === 0) {
      this.peer.on('call', function(call) {
        if(!self.peers[call.peer]) {
          self.peers[call.peer] = {};
        }
        if(call.metadata && call.metadata.type === 'screen') {
          self.peers[call.peer].screen_receiver = call;
          call.answer();
          self.setupStreamHandler_(call);
        } else {
          self.peers[call.peer].call = call;
          call.answer(self.stream);
          self.setupStreamHandler_(call);
          if(self.screenStream !== undefined){
            var call = self.peer.call(
                call.peer,
                self.screenStream,
                {metadata:{type:'screen'}}
            );
            self.peers[call.peer].screen_sender = call;
          }
        }
      });
    }
  }

  // peerからのvideo stream, closeに対し、ハンドラをセットする
  MultiParty_.prototype.setupStreamHandler_ = function(call) {
    var self = this;

    call.on('stream', function(stream) {
      if(call.metadata && call.metadata.type === 'screen') {
        self.peers[this.peer].screen_receiver.stream = stream;
        self.setupPeerScreen_(this.peer, stream);
      } else {
        self.peers[this.peer].call.stream = stream;
        self.setupPeerVideo_(this.peer, stream);
      }

    }).on('close', function(){
      // todo : check skyway server to see this connection is disconnected.
      // if disconnected : remove objects for this and fire.
      // if not disconnected : recall media stream

      if(call.metadata && call.metadata.type === 'screen') {
        self.fire_('ss_close', this.peer);
      } else {
        self.fire_('ms_close', this.peer);
      }
      if(self.peers[this.peer] &&
          (self.peers[this.peer].call === undefined || !self.peers[this.peer].call.open)
          && (self.peers[this.peer].screen_sender === undefined || !self.peers[this.peer].screen_sender.open)) {
        delete self.peers[this.peer];
      }
    });
  }

  // peerのvideo Nodeをセットアップする
  // loadedmetadataが完了したら、'peer_video'をfireする
  MultiParty_.prototype.setupPeerVideo_ = function(peer_id, stream) {
    var self = this;
    var video = document.createElement('video');
    var url = window.URL.createObjectURL(stream);

    video.setAttribute("id", peer_id);
    video.setAttribute("src", url);
    video.addEventListener("loadedmetadata", function(ev) {
      self.peers[peer_id].video = video;
      self.fire_('peer_ms', video);
      setTimeout(function(ev){ video.play(); }, 10);
    });
  }

  // peerのvideo Nodeをセットアップする
  // loadedmetadataが完了したら、'peer_video'をfireする
  MultiParty_.prototype.setupPeerScreen_ = function(peer_id, stream) {
    var self = this;
    var video = document.createElement('video');
    var url = window.URL.createObjectURL(stream);

    video.setAttribute("data-id", peer_id);
    video.setAttribute("src", url);
    video.addEventListener("loadedmetadata", function(ev) {
      self.peers[peer_id].screen_receiver.video = video;
      self.fire_('peer_ss', video);
      setTimeout(function(ev){ video.play(); }, 10);
    });
  }
  
  // peerのdcとmcを全てクローズする
  MultiParty_.prototype.removePeer = function(peer_id) {
    try{
      if(this.peers[peer_id] !== undefined) {
        var peer = this.peers[peer_id];
        if(peer.call) {
          peer.call.close();
        }
        if(peer.DCconn_receiver) {
          peer.DCconn_receiver.close();
        }
        if(peer.DCconn_sender) {
          peer.DCconn_sender.close();
        }
      }
    } finally {
      delete this.peers[peer_id];
    }
  }


  //////////////////////////////////
  // DataChannel 処理

  // DataChannel 処理を開始する
  MultiParty_.prototype.startDataChannel_ = function(){
    this.startDCconnection_();
  }

  // DataChannelのコネクション処理を行う
  MultiParty_.prototype.startDCconnection_ = function(){
    var self = this;

    // API経由で取得したIDには、自分からconnectする
    for ( var peer_id in this.peers ) {
      this.DCconnect_(peer_id);
    }

    //新規に接続してきたpeerからのconnection要求を受け付けるハンドラ
    this.peer.on('connection', function(conn) {
      self.fire_('dc_receiver_open', conn.peer);
      if(!self.peers[conn.peer]) {
        self.peers[conn.peer] = {};
      }
      self.peers[conn.peer].DCconn_receiver = conn;

      if(!self.peers[conn.peer].DCconn_sender) {
        self.DCconnect_(conn.peer);
      }

      self.setupDCReceiveHandler_(conn);
    });
  }

  // DataChannelのコネクション処理を行う
  MultiParty_.prototype.DCconnect_ = function(peer_id){
    var conn = this.peer.connect(peer_id, {"serialization": this.opts.serialization, "reliable": this.opts.reliable});
    this.peers[peer_id].DCconn_sender = conn;

    conn.on('open', function() {
      this.fire_('dc_sender_open', peer_id);
      this.setupDCSenderHandler_(conn);
    }.bind(this));
  }

  // DataChannelのSenderイベントハンドラをセットする
  MultiParty_.prototype.setupDCSenderHandler_ = function(conn) {
    var self = this;

    conn.on('close', function() {
      // todo : check skyway server to see this connection is disconnected.
      // if disconnected : remove objects for this and fire.
      // if not disconnected : reconnect datachannel
      if(self.peers[this.peer] && self.peers[this.peer].DCconn) {
        self.peers[this.peer].DCconn = null;
      }
      self.fire_('dc_close', this.peer);
    });
  }

  // DataChannelのReceiverイベントハンドラをセットする
  MultiParty_.prototype.setupDCReceiveHandler_ = function(conn) {
    var self = this;

    conn.on('data', function(data) {
      self.fire_('message', {"id": this.peer, "data": data});
    }).on('close', function() {
      if(self.peers[this.peer] && self.peers[this.peer].DCconn) {
        self.peers[this.peer].DCconn = null;
      }
      self.fire_('dc_close', this.peer);
    });
  }

  // DataChannelでつながっているpeerにメッセージを送信する
  MultiParty_.prototype.send_ = function(data) {
    if(!this.peer) {
      return false;
    }

    if(data && typeof(data) === "string" && data.length === 0) {
      return false;
    }

    if(data && (typeof(data) === "string" || typeof(data) === "object")) {
      for(var peer_id in this.peers) if(this.peers[peer_id].DCconn_sender) {
        this.peers[peer_id].DCconn_sender.send(data);
      }
    }
  }

  // イベントを発火する
  MultiParty_.prototype.fire_ = function(name, obj) {
    this.emit(name, obj);
  }



  /////////////////////////////////////
  // utility
  MultiParty_.util = {};

  // オプションのチェック
  MultiParty_.util.checkOpts_ = function(opts_) {
    var opts = {};

    // key check (なかったら throw)
    if(!opts_.key || typeof(opts_.key) !== "string") {
      throw "app key must be specified";
    };

    // key check ( string patter がマッチしなかったら throw )
    if(!opts_.key.match(/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/)) {
      throw "wrong string pattern of app key";
    };
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

    seed += location.host + location.pathname;

    opts.room_id = CybozuLabs.MD5.calc(seed).substring(0,6) + "R_";

    // id check (なかったら生成）
    if(!opts_.id || typeof(opts_.id) !== "string") {
      opts.id = opts.room_id + MultiParty_.util.makeID();
    } else {
      opts.id = opts.room_id + opts_.id;
    }

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

    return opts;
  }



  // IDを作る
  MultiParty_.util.makeID = function() {
    var id = "";

    for (var i = 0; i < 32; i++) {
      // id += String.fromCharCode( (Math.random() * (125 - 33) + 33) | 0)
      id += String.fromCharCode( (Math.random() * (57 - 48) + 48) | 0)
    }
    return id;
  }



  ////////////////////////////////////
  // public method

  MultiParty_.prototype.send = function(data) {
    if(this.peer) this.send_(data);
  }

  // 切断する
  MultiParty_.prototype.close = function() {
    if(this.peer) this.peer.destroy();
  }
  
  MultiParty_.prototype.startScreenShare = function(success, error) {
    if(this.peer) {
      var self = this;
      if(SkyWayPlugin && SkyWayPlugin.ScreenShare) {
        var sc = new SkyWayPlugin.ScreenShare();
        sc.setParam(screen.width,screen.height,5);
        sc.getScreen(function (stream) {
          self.screenStream = stream;
          self.startCall_(true);
          
          //callback use video
          success(stream);
        }, error);
      }
    }
  }
  
  MultiParty_.prototype.stopScreenShare = function() {
    if(this.screenStream){
      this.screenStream.stop();
      for(var peer_id in this.peers){
        if(this.peers[peer_id].screen_sender) {
          this.peers[peer_id].screen_sender.close()
        }
        delete this.peers[peer_id].screen_sender;
      }
    this.screenStream = undefined;
    }
  }
  
  // 同じRoomのpeer listを取得
  MultiParty_.prototype.listAllPeers = function(callback) {
    var self = this;
    this.peer.listAllPeers(
      function(peers){
        var roomPeers = [];
        peers.forEach(function(peer_id) {
          // peer_idが自分のidではなく、かつ、peer_idの接頭辞がroom_idの場合
          if(peer_id !== self.opts.id && peer_id.indexOf(self.opts.room_id) === 0) {
            roomPeers.push(peer_id);
          }
        });
        callback(roomPeers);
      });
  }

  // オブジェクトの宣言
  if (!global.MultiParty) {
    global.MultiParty = MultiParty_;
  }
}(window));


