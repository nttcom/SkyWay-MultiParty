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

    this.start_();
  }

  // EventEmitterを継承する
  MultiParty_.prototype = new EventEmitter2();

  ///////////////////////////////////
  // private method

  // video stream 取得開始
  MultiParty_.prototype.start_ = function() {
    var self = this;

    navigator.getUserMedia_({"video": true, "audio": true},
      function(stream) {
        self.stream = stream;
        var url = window.URL.createObjectURL(self.stream);
        self.video.setAttribute("src", url);
        self.video.setAttribute("muted", true);

        self.video.addEventListener("loadedmetadata", function(ev) {
          self.video.play();
          self.open_();
        }, false);
      }, function(err) {
        throw err;
      }
    );
  }

  // SkyWayサーバーに繋ぐ
  MultiParty_.prototype.open_ = function() {
    this.peer = new Peer(this.id, {key: this.key});

    // SkyWayサーバーへの接続が完了したら、open イベントを起こす
    this.peer.on('open', function(id) {
      // todo: error check
      
      this.id = id;
      this.fire_('open', this.video);

      // open イベントを発火する
      this.getIDs_();
    }.bind(this));

    // todo : SkyWayサーバーへの接続が失敗した場合のerror処理
  }

  // イベントを発火する
  MultiParty_.prototype.fire_ = function(name, obj) {
    this.emit(name, obj);
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
        if(peer_id !== self.id) {
          self.peers[peer_id] = {};
        }
      });

      // peersに対して、media stream callを開始する
      if(this.stream) {
        this.startCall_();
      }
    }.bind(this);

    xhr.send();
  }

  // オプションのチェック
  MultiParty_.prototype.checkOpts_ = function() {
    // key check (なかったら throw)
    if(!this.opts_.key || typeof(this.opts_.key) !== "string") {
      throw "app key must be specified";
    };
    this.key = this.opts_.key;

    // room check (なかったら "")
    if(!this.opts_.room || typeof(this.opts_.room) !== "string") {
      this.room = "";
    } else {
      this.room = this.opts_.room
    };

    // id check (なかったら生成）
    if(!this.opts_.id || typeof(this.opts_.id) !== "string") {
      this.id = this.room + "R_" + this.util.makeID();
    }
  }

  // peersに対して、MediaStream callを開始する
  MultiParty_.prototype.startCall_ = function() {
    var self = this;

    for( var peer_id in this.peers) {
      console.log(peer_id);
      var call = self.peer.call(peer_id, self.stream);

      call.on('stream', function(stream) {
        self.peers[peer_id].stream = stream;
        self.setupPeerVideo(peer_id, stream);
      }).on('close', function() {
        self.fire_('peer_close', this.peer)
      });
    };

    // peerからcallが来た時のイベントハンドラ
    self.peer.on('call', function(call) {
      console.log(call);
      self.peers[call.peer] = {};
      self.peers[call.peer].call = call;
      call.answer(self.stream);

      call.on('stream', function(stream) {
        self.peers[call.peer].stream = stream;
        self.setupPeerVideo(call.peer, stream);
      }).on('close', function(){
        self.fire_('peer_close', this.peer);
      });
    });
  }

  // peerのvideo Nodeをセットアップする
  // loadedmetadataが完了したら、'peer_video'をfireする
  MultiParty_.prototype.setupPeerVideo = function(peer_id, stream) {
    var self = this;
    var video = document.createElement('video');
    var url = window.URL.createObjectURL(stream);
    video.setAttribute("id", peer_id);
    video.setAttribute("src", url);
    video.addEventListener("loadedmetadata", function(ev) {
      video.play();
      self.peers[peer_id].video = video;
      self.fire_('peer_video', video);
    });
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

  // 切断する
  MultiParty_.prototype.close = function() {
  }

  // オブジェクトの宣言
  if (!global.MultiParty) {
    global.MultiParty = MultiParty_;
  }
}(window));


