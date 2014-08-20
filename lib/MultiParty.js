/**
 * MultiParty.js
 *
 * SkyWayで簡単にマルチパーティ接続を実現するライブラリ
 */


(function(global){

  navigator.getUserMedia_ = navigator.getUserMedia
    || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia;


  // コンストラクタ
  var MultiParty_ = function(opts){
    this.room = null; // ルーム名
    this.id = null; // ID
    this.key = null; // app key
    this.peers = {}; // peer Objects
    this.stream = null; // my media stream
    this.video = document.createElement("video"); // my video node

    this.opts_ = opts;

    // option をチェック
    // room, myid, key プロパティを割り当てる
    this.checkOpts_();

    this.conn2SkyWay_();

  }

  // EventEmitterを継承する
  MultiParty_.prototype = new EventEmitter2();


  ///////////////////////////////////
  // private method


  // オプションのチェック
  MultiParty_.prototype.checkOpts_ = function() {
    // key check (なかったら throw)
    if(!this.opts_.key || typeof(this.opts_.key) !== "string") {
      throw "app key must be specified";
    };
    this.key = this.opts_.key;

    // todo : room prefix にdomainを意識したほげほげ
    // room check (なかったら "")
    if(!this.opts_.room || typeof(this.opts_.room) !== "string") {
      var seed = "";
    } else {
      var seed = this.opts_.room
    };

    seed += location.host + location.pathname;
    this.room = CybozuLabs.MD5.calc(seed).substring(0,6) + "R_";

    // id check (なかったら生成）
    if(!this.opts_.id || typeof(this.opts_.id) !== "string") {
      this.id = this.room + this.util.makeID();
    }

    // stream check
    this.video_stream = (this.opts_.video === undefined ? true : this.opts_.video);
    this.audio_stream = (this.opts_.audio === undefined ? true : this.opts_.audio);
    this.stream = this.video_stream && this.audio_stream;
  }


  // SkyWayサーバーに繋ぐ
  MultiParty_.prototype.conn2SkyWay_ = function() {
    this.peer = new Peer(this.id, {key: this.key});
    this.opened = false;

    // SkyWayサーバーへの接続が完了したら、open イベントを起こす
    this.peer.on('open', function(id) {
      if(this.opened) {
        throw "connection to SkyWay is already opened";
      } else {
        this.opened = true;
      }

      // todo: error check
      console.log('open');

      this.id = id;
      // open イベントを発火する
      this.fire_('open', id);

      // 接続中のIDを取得する
      this.getIDs_();
    }.bind(this));

    // todo : SkyWayサーバーへの接続が失敗した場合のerror処理
  }

  // 接続中のIDを取得する
  MultiParty_.prototype.getIDs_ = function() {
    var xhr = new XMLHttpRequest();
    var self = this;

    xhr.open('GET', 'https://skyway.io/v2/active/list/' + this.key);

    xhr.onload = function(ev) {
      // todo: error処理

      var peers_ = JSON.parse(xhr.responseText);

      peers_.forEach(function(peer_id) {
        // todo : Room check
        if(peer_id !== self.id && peer_id.indexOf(self.room) === 0) {
          self.peers[peer_id] = {};
        }
      });

      // MediaStream処理を開始する
      if(self.stream) {
        self.startMediaStream_();
      }

      // DataChannel処理を開始する
      self.startDataChannel_();
    };

    xhr.send();
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

    navigator.getUserMedia_({"video": self.video_stream, "audio": self.audio_stream},
      function(stream) {
        self.stream = stream;
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


  // peersに対して、MediaStream callを開始する
  MultiParty_.prototype.startCall_ = function() {
    var self = this;

    // API経由で取得したIDには、自分からcallする（caller）
    for( var peer_id in this.peers) {
      (function(self){
        var call = self.peer.call(peer_id, self.stream);
        self.peers[peer_id].call = call;

        self.setupStreamHandler_(call);
      }(self));
    };


    // 新規に接続してきたpeerからのcallを受け付けるハンドラ
    this.peer.on('call', function(call) {
      if(!self.peers[call.peer]) {
        self.peers[call.peer] = {};
      }
      self.peers[call.peer].call = call;
      call.answer(self.stream);

      self.setupStreamHandler_(call);
    });
  }

  // peerからのvideo stream, closeに対し、ハンドラをセットする
  MultiParty_.prototype.setupStreamHandler_ = function(call) {
    var self = this;

    call.on('stream', function(stream) {
      self.peers[this.peer].stream = stream;
      self.setupPeerVideo_(this.peer, stream);
    }).on('close', function(){
      delete self.peers[this.peer];
      self.fire_('ms_close', this.peer);
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
    var conn = this.peer.connect(peer_id, {"serialization": "json", "reliable": true});
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

    if(data && typeof(data) === "string" && data.lendth === 0) {
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
  MultiParty_.prototype.util = {};

  // IDを作る
  MultiParty_.prototype.util.makeID = function() {
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

  // オブジェクトの宣言
  if (!global.MultiParty) {
    global.MultiParty = MultiParty_;
  }
}(window));


