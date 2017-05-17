/**
 * MultiParty.js
 *
 * SkyWayで簡単にマルチパーティ接続を実現するライブラリ
 */

const EventEmitter = require('events').EventEmitter
const util = require('./util')
const Peer = require('skyway-peerjs')

navigator.getUserMedia_ = navigator.getUserMedia
  || navigator.webkitGetUserMedia
  || navigator.mozGetUserMedia;

class MultiParty extends EventEmitter {
  constructor(opts) {
    super();

    this.room = null; // ルーム名
    this.id = null; // ID
    this.key = null; // app key
    this.peers = {}; // peer Objects
    this.stream = null; // my media stream
    this.tracks_ = {};
    this.pollInterval = null;

    this.opened = false;

    // option をチェック
    // room, myid, key プロパティを割り当てる
    this.opts = util.checkOpts_(opts);
  }

  // SkyWayサーバーに繋ぐ
  conn2SkyWay_() {
    var self = this;


    this.peer = new Peer(this.opts.id, this.opts.peerjs_opts);

    // SkyWayサーバーへの接続が完了したら、open イベントを起こす
    this.peer.on('open', function(id) {
      if(this.opened) {
        throw "Error : connection to SkyWay is already opened";
      } else {
        this.opened = true;
      }

      // id check
      if(id !== this.opts.id) {
        throw "Error : SkyWay returns wrong peer id for myself";
      }

      // open イベントを発火する
      this.fire_('open', id);

      // 接続中のIDを取得する
      this.getIDs_();

      // 接続確認pollingを始める
      if(this.opts.polling) {
        this.startPollingConnections_();
      }
    }.bind(this));

    // SkyWayサーバーへの接続が失敗した場合のerror処理
    this.peer.on("error", function(err) {
      self.fire_('error', err)
    });
  }

  // 接続中のIDを取得する
  getIDs_() {
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

  // 接続中のIDとサーバのIDを比較して再接続・切断する
  startPollingConnections_(){
    var self = this;
    self.pollInterval = setInterval(function(){
      self.listAllPeers(function(newList){
        for(var peer_id in self.peers){
          var removeId = true;
          if(peer_id === undefined) {
            return;
          }
          $.each(newList, function(j, peerId){
            if(peer_id === peerId) {
            removeId = false;
            }
          });
          if(removeId) {
            self.removePeer(peer_id);
          } else {
            var peer = self.peers[peer_id];
            var reconnect = {
              video: peer.call?!peer.call.open:false,
              screen: peer.screen_sender?!peer.screen_sender.open:false,
              data: peer.DCconn?!peer.DCconn.open:false
            };
            if(reconnect.video || reconnect.screen || reconnect.data) {
              if(!peer.reconnectIndex_){
                peer.reconnectIndex_ = 1;
              } else {
                peer.reconnectIndex_++;
              }
              // reconnect on powers of 2 minus (1, 2, 4, 8 ...)
              if((peer.reconnectIndex_ & (peer.reconnectIndex_-1)) == 0){
                self.reconnect(peer_id, reconnect);
              }
            } else {
              peer.reconnectIndex_ = 0;
            }
          }
        };
      })
    }, self.opts.polling_interval);
  }

  ////////////////////////////////////
  // video 処理

  // Media Stream 処理の開始
  startMediaStream_(){
    this.startMyStream_();
  }

  // video stream 取得開始
  startMyStream_() {
    var self = this;

    navigator.getUserMedia_({"video": self.opts.video_stream, "audio": self.opts.audio_stream},
      function(stream) {
        if(self.opts.audio_stream){
          self.tracks_.audio = stream.getAudioTracks()[0];
        }

        if(self.opts.video_stream){
          self.tracks_.video = stream.getVideoTracks()[0];
        }

        self.stream = stream;

        self.fire_('my_ms', {"src": URL.createObjectURL(self.stream), "id": self.opts.id});
        self.startCall_();

      }, function(err) {
        self.fire_('error', err)
      }
    );
  }

  // mute either media and audio track
  //
  //
  // snipet.
  // ```
  // multiparty.mute({audio: true});  // only audio becomes mute, so callee becomes not to hear about caller voice.
  // ```
  mute(target_track /* {"video": boolean, "audio": boolean} */) {
    // if parameter **target_track** does not proper value. We forcibly set both mute.
    if( typeof(target_track) !== "object" ) { target_track = {video:true, audio:true}; }

    // make each stream mute based on parameter
    if( typeof(target_track.audio) !== "undefined" ) { this.tracks_.audio.enabled = !target_track.audio; }
    if( typeof(target_track.video) !== "undefined" ) { this.tracks_.video.enabled = !target_track.video; }
  };

  // unmute either media and audio track
  //
  //
  // snipet.
  // ```
  // multiparty.unmute({audio: true});  // only audio becomes unmute, so caller's face cannot be seen from callee side.
  // ```
  unmute(target_track /* {"video": boolean, "audio": boolean} */) {
    // if parameter **target_track** does not proper value. We forcibly set both unmute.
    if( typeof(target_track) !== "object") { target_track = {video:true, audio:true}; }

    // make each stream unmute based on parameter
    if( typeof(target_track.audio) !== "undefined") { this.tracks_.audio.enabled = !!target_track.audio; }
    if( typeof(target_track.video) !== "undefined") { this.tracks_.video.enabled = !!target_track.video; }
  };


  // peersに対して、MediaStream callを開始する
  startCall_(isScreen) {
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
            console.log("peer.call called from screenshare startCall_");
            self.peers[peer_id].screen_sender = call;
            self.setupStreamHandler_(call);
          }
        } else {
          var call = self.peer.call(
              peer_id,
              self.stream
          );
          console.log("peer.call called from generic media exchange startCall_");
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
          console.log("peer.call called from call callback");
        }
      });
    }
  }

  // peerからのvideo stream, closeに対し、ハンドラをセットする
  setupStreamHandler_(call) {
    var self = this;
    var isReconnect = !!(call.metadata && call.metadata.reconnect);

    call.on('stream', function(stream) {
      if(call.metadata && call.metadata.type === 'screen') {
        self.peers[this.peer].screen_receiver.stream = stream;
        self.setupPeerScreen_(this.peer, stream, isReconnect);
      } else {
        self.peers[this.peer].call.stream = stream;
        self.setupPeerVideo_(this.peer, stream, isReconnect);
      }

    }).on('close', function(){
      // handle peer close event
      // check skyway server to see this user is disconnected.


      var peer_id = this.peer;
      var metadata = this.metadata;
      var isScreenShare = !!(metadata && metadata.type === 'screen');
      var isSSCaller =
        (self.peers[this.peer].screen_sender &&
         self.peers[this.peer].screen_sender.id === this.id);
      self.listAllPeers(function(list){
          var isDisconnected = true;
          for(var index in list) {
              if(list[index] === peer_id) {
                  isDisconnected = false;
                  break;
              }
          }
          if(isDisconnected || isScreenShare){
              if(isScreenShare) {
                  // don't emit ss_close if you're the sender
                  if (!isSSCaller) {
                    self.fire_('ss_close', peer_id);
                  }
              } else {
                  self.fire_('ms_close', peer_id);
              }
              // check if user has any other open connections
              if(self.peers[peer_id] &&
                (self.peers[peer_id].call === undefined || !self.peers[peer_id].call.open) &&
                (self.peers[peer_id].DCconn === undefined || !self.peers[peer_id].DCconn.open) &&
                (self.peers[peer_id].screen_sender === undefined || !self.peers[peer_id].screen_sender.open)) {
                  self.removePeer(peer_id);
              }
          } else {
              // leave reconnecting up to startPollingConnections_
          }
      });
    });
  }

  // peerのvideoのObjectURLを生成し、frontにpeer_msイベントを返す
  setupPeerVideo_(peer_id, stream, isReconnect) {
    // prevent to call twice.
    // if(!!this.peers[peer_id].video) return;

    var url = window.URL.createObjectURL(stream);

    // set isReconnect as boolean
    isReconnect = !!isReconnect;

    this.peers[peer_id].video = stream;
    this.fire_('peer_ms', {id: peer_id, src: url, reconnect: isReconnect});
  }

  // peerのvideo Nodeをセットアップする
  // loadedmetadataが完了したら、'peer_video'をfireする
  setupPeerScreen_(peer_id, stream, isReconnect) {
    var self = this;
    if(!isReconnect){
      isReconnect = false;
    }

    self.peers[peer_id].screen_receiver.video = stream;
    self.fire_('peer_ss', {src: URL.createObjectURL(stream), id: peer_id, reconnect: isReconnect});
  }

  // peerのdcとmcを全てクローズする
  removePeer(peer_id) {
    try{
      if(this.peers[peer_id] !== undefined) {
        var peer = this.peers[peer_id];
        if(peer.call) {
          peer.call.close();
        }
        if(peer.screen_sender) {
          peer.screen_sender.close();
        }
        if(peer.screen_receiver) {
          peer.screen_receiver.close();
        }
        if(peer.DCconn) {
          peer.DCconn.close();
        }
      }
    } finally {
      delete this.peers[peer_id];
    }
  }


  //////////////////////////////////
  // DataChannel 処理

  // DataChannel 処理を開始する
  startDataChannel_(){
    this.startDCconnection_();
  }

  // DataChannelのコネクション処理を行う
  startDCconnection_(){
    var self = this;

    // API経由で取得したIDには、自分からconnectする
    for ( var peer_id in this.peers ) {
      this.DCconnect_(peer_id);
    }

    //新規に接続してきたpeerからのconnection要求を受け付けるハンドラ
    this.peer.on('connection', function(conn) {
      if(!self.peers[conn.peer]) {
        self.peers[conn.peer] = {};
      }
      self.peers[conn.peer].DCconn = conn;

      self.setupDCHandler_(conn);
      self.fire_('dc_open', conn.peer);
    });
  }

  // DataChannelのコネクション処理を行う
  DCconnect_(peer_id){
    var conn = this.peer.connect(peer_id, {"serialization": this.opts.serialization, "reliable": this.opts.reliable});
    this.peers[peer_id].DCconn = conn;

    conn.on('open', function() {
      this.setupDCHandler_(conn);
      this.fire_('dc_open', conn.peer);
    }.bind(this));
  }

  // DataChannelのイベントハンドラをセットする
  setupDCHandler_(conn) {
    var self = this;
    conn.on('data', function(data) {
      self.fire_('message', {"id": this.peer, "data": data});
    }).on('close', function() {
      // handle peer close event
      // check skyway server to see this user is disconnected.
      var peer_id = this.peer;
      self.listAllPeers(function(list) {
        var isDisconnected = true;
        for (var index in list) {
          if (list[index] === peer_id) {
            isDisconnected = false;
            break;
          }
        }
        if(isDisconnected){
          self.fire_('dc_close', peer_id);
          // check if user has any other open connections
          if(self.peers[peer_id] &&
            (self.peers[peer_id].call === undefined || !self.peers[peer_id].call.open) &&
            (self.peers[peer_id].DCconn === undefined || !self.peers[peer_id].DCconn.open) &&
            (self.peers[peer_id].screen_sender === undefined || !self.peers[peer_id].screen_sender.open)) {
            self.removePeer(peer_id);
          }
        } else {
          // leave reconnecting up to startPollingConnections_
        }
      });
    });
  }

  // DataChannelでつながっているpeerにメッセージを送信する
  send_(data) {
    if(!this.peer) {
      return false;
    }

    if(data && typeof(data) === "string" && data.length === 0) {
      return false;
    }

    if(data && (typeof(data) === "string" || typeof(data) === "object")) {
      for(var peer_id in this.peers) if(this.peers[peer_id].DCconn) {
        this.peers[peer_id].DCconn.send(data);
      }
    }
  }

  // イベントを発火する
  fire_(name, obj) {
    this.emit(name, obj);
  }

  ////////////////////////////////////
  // public method

  start() {
    var self = this;
    setTimeout(function(){
      self.conn2SkyWay_();
    }, 0);
    return self;
  }

  send(data) {
    if(this.peer) this.send_(data);
  }

  // 切断する
  close() {
    if(this.peer) this.peer.destroy();
    clearInterval(this.pollInterval);
  }

  // 画面共有を開始する
  startScreenShare(success, error) {
      if(this.peer) {
          var self = this;
          if(SkyWay && SkyWay.ScreenShare) {
              var sc = new SkyWay.ScreenShare();
              if(sc.isEnabledExtension()) {
                  sc.startScreenShare({
                      Width: screen.width,
                      Height: screen.height,
                      FrameRate: 5
                  },function (stream){
                      self.screenStream = stream;
                      self.startCall_(true);
                      util.log("MediaConnection created in OFFER");

                      //callback use video
                      success(stream);
                  }, error);
              }
          }
      }
  }


  // 画面共有を停止する
  stopScreenShare() {
    if(this.screenStream){
      this.screenStream.getVideoTracks()[0].stop();
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
  listAllPeers(callback) {
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

  // ユーザに再接続する
  reconnect(peer_id, connections) {
    var self = this;
    var peer = self.peers[peer_id];
    if(connections === undefined) {
      connections = {
        video: true,
        screen: true,
        data: true
      }
    }
    if(peer) {
      if(connections.video) {
        if(peer.call && peer.call.close){
          peer.call.close();
        }
        var call = self.peer.call(
            peer_id,
            self.stream,
            {metadata: {reconnect: true}}
        );

        console.log("peer.call called from reconnect method");
        peer.call = call;
        self.setupStreamHandler_(call);
      }
      if(connections.screen) {
        if(self.screenStream) {
          if(peer.screen_sender && peer.screen_sender.close){
            peer.screen_sender.close();
          }
          var call = self.peer.call(
              peer_id,
              self.screenStream,
              {metadata: {reconnect: true, type: 'screen'}}
          );
          console.log("peer.call called from reconnect method in screenshare");
          peer.screen_sender = call;
        }
      }
      if(connections.data) {
        if(peer.DCconn && peer.DCconn.close){
          peer.DCconn.close();
        }
        var conn = this.peer.connect(peer_id,
          {
            "serialization": this.opts.serialization,
            "reliable": this.opts.reliable,
            "metadata": {reconnect: true}
          }
        ).on('open', function(){
          peer.DCconn = conn;
          self.setupDCHandler_(conn);
        });
      }
    }
  }
}

MultiParty.util = util;

module.exports = MultiParty;

