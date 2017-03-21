/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/dist/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {"use strict";
	
	var MultiParty = __webpack_require__(2);
	
	if (module.require) {
	  module.exports = MultiParty;
	} else {
	  window.MultiParty = MultiParty;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)(module)))

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	/**
	 * MultiParty.js
	 *
	 * SkyWayで簡単にマルチパーティ接続を実現するライブラリ
	 */
	
	var EventEmitter = __webpack_require__(3).EventEmitter;
	var util = __webpack_require__(4);
	
	navigator.getUserMedia_ = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	
	var MultiParty = function (_EventEmitter) {
	  _inherits(MultiParty, _EventEmitter);
	
	  function MultiParty(opts) {
	    _classCallCheck(this, MultiParty);
	
	    var _this = _possibleConstructorReturn(this, (MultiParty.__proto__ || Object.getPrototypeOf(MultiParty)).call(this));
	
	    _this.room = null; // ルーム名
	    _this.id = null; // ID
	    _this.key = null; // app key
	    _this.peers = {}; // peer Objects
	    _this.stream = null; // my media stream
	    _this.tracks_ = {};
	    _this.pollInterval = null;
	
	    _this.opened = false;
	
	    // option をチェック
	    // room, myid, key プロパティを割り当てる
	    _this.opts = util.checkOpts_(opts);
	    return _this;
	  }
	
	  // SkyWayサーバーに繋ぐ
	
	
	  _createClass(MultiParty, [{
	    key: 'conn2SkyWay_',
	    value: function conn2SkyWay_() {
	      var self = this;
	
	      this.peer = new Peer(this.opts.id, this.opts.peerjs_opts);
	
	      // SkyWayサーバーへの接続が完了したら、open イベントを起こす
	      this.peer.on('open', function (id) {
	        if (this.opened) {
	          throw "Error : connection to SkyWay is already opened";
	        } else {
	          this.opened = true;
	        }
	
	        // id check
	        if (id !== this.opts.id) {
	          throw "Error : SkyWay returns wrong peer id for myself";
	        }
	
	        // open イベントを発火する
	        this.fire_('open', id);
	
	        // 接続中のIDを取得する
	        this.getIDs_();
	
	        // 接続確認pollingを始める
	        if (this.opts.polling) {
	          this.startPollingConnections_();
	        }
	      }.bind(this));
	
	      // SkyWayサーバーへの接続が失敗した場合のerror処理
	      this.peer.on("error", function (err) {
	        self.fire_('error', err);
	      });
	    }
	
	    // 接続中のIDを取得する
	
	  }, {
	    key: 'getIDs_',
	    value: function getIDs_() {
	      var self = this;
	
	      self.listAllPeers(function (peers) {
	        peers.forEach(function (peer_id) {
	          self.peers[peer_id] = {};
	        });
	
	        // MediaStream処理を開始する
	        if (self.opts.use_stream) {
	          self.startMediaStream_();
	        }
	
	        // DataChannel処理を開始する
	        self.startDataChannel_();
	      });
	    }
	
	    // 接続中のIDとサーバのIDを比較して再接続・切断する
	
	  }, {
	    key: 'startPollingConnections_',
	    value: function startPollingConnections_() {
	      var self = this;
	      self.pollInterval = setInterval(function () {
	        self.listAllPeers(function (newList) {
	          for (var peer_id in self.peers) {
	            var removeId = true;
	            if (peer_id === undefined) {
	              return;
	            }
	            $.each(newList, function (j, peerId) {
	              if (peer_id === peerId) {
	                removeId = false;
	              }
	            });
	            if (removeId) {
	              self.removePeer(peer_id);
	            } else {
	              var peer = self.peers[peer_id];
	              var reconnect = {
	                video: peer.call ? !peer.call.open : false,
	                screen: peer.screen_sender ? !peer.screen_sender.open : false,
	                data: peer.DCconn ? !peer.DCconn.open : false
	              };
	              if (reconnect.video || reconnect.screen || reconnect.data) {
	                if (!peer.reconnectIndex_) {
	                  peer.reconnectIndex_ = 1;
	                } else {
	                  peer.reconnectIndex_++;
	                }
	                // reconnect on powers of 2 minus (1, 2, 4, 8 ...)
	                if ((peer.reconnectIndex_ & peer.reconnectIndex_ - 1) == 0) {
	                  self.reconnect(peer_id, reconnect);
	                }
	              } else {
	                peer.reconnectIndex_ = 0;
	              }
	            }
	          };
	        });
	      }, self.opts.polling_interval);
	    }
	
	    ////////////////////////////////////
	    // video 処理
	
	    // Media Stream 処理の開始
	
	  }, {
	    key: 'startMediaStream_',
	    value: function startMediaStream_() {
	      this.startMyStream_();
	    }
	
	    // video stream 取得開始
	
	  }, {
	    key: 'startMyStream_',
	    value: function startMyStream_() {
	      var self = this;
	
	      navigator.getUserMedia_({ "video": self.opts.video_stream, "audio": self.opts.audio_stream }, function (stream) {
	        if (self.opts.audio_stream) {
	          self.tracks_.audio = stream.getAudioTracks()[0];
	        }
	
	        if (self.opts.video_stream) {
	          self.tracks_.video = stream.getVideoTracks()[0];
	        }
	
	        self.stream = stream;
	
	        self.fire_('my_ms', { "src": URL.createObjectURL(self.stream), "id": self.opts.id });
	        self.startCall_();
	      }, function (err) {
	        self.fire_('error', err);
	      });
	    }
	
	    // mute either media and audio track
	    //
	    //
	    // snipet.
	    // ```
	    // multiparty.mute({audio: true});  // only audio becomes mute, so callee becomes not to hear about caller voice.
	    // ```
	
	  }, {
	    key: 'mute',
	    value: function mute(target_track /* {"video": boolean, "audio": boolean} */) {
	      // if parameter **target_track** does not proper value. We forcibly set both mute.
	      if ((typeof target_track === 'undefined' ? 'undefined' : _typeof(target_track)) !== "object") {
	        target_track = { video: true, audio: true };
	      }
	
	      // make each stream mute based on parameter
	      if (typeof target_track.audio !== "undefined") {
	        this.tracks_.audio.enabled = !target_track.audio;
	      }
	      if (typeof target_track.video !== "undefined") {
	        this.tracks_.video.enabled = !target_track.video;
	      }
	    }
	  }, {
	    key: 'unmute',
	
	
	    // unmute either media and audio track
	    //
	    //
	    // snipet.
	    // ```
	    // multiparty.unmute({audio: true});  // only audio becomes unmute, so caller's face cannot be seen from callee side.
	    // ```
	    value: function unmute(target_track /* {"video": boolean, "audio": boolean} */) {
	      // if parameter **target_track** does not proper value. We forcibly set both unmute.
	      if ((typeof target_track === 'undefined' ? 'undefined' : _typeof(target_track)) !== "object") {
	        target_track = { video: true, audio: true };
	      }
	
	      // make each stream unmute based on parameter
	      if (typeof target_track.audio !== "undefined") {
	        this.tracks_.audio.enabled = !!target_track.audio;
	      }
	      if (typeof target_track.video !== "undefined") {
	        this.tracks_.video.enabled = !!target_track.video;
	      }
	    }
	  }, {
	    key: 'startCall_',
	
	
	    // peersに対して、MediaStream callを開始する
	    value: function startCall_(isScreen) {
	      var self = this;
	
	      // API経由で取得したIDには、自分からcallする（caller）
	      for (var peer_id in this.peers) {
	        (function (self) {
	          if (isScreen === true) {
	            if (!self.peers[peer_id].screen_sender || self.peers[peer_id].screen_sender.open) {
	              var call = self.peer.call(peer_id, self.screenStream, { metadata: { type: 'screen' } });
	              console.log("peer.call called from screenshare startCall_");
	              self.peers[peer_id].screen_sender = call;
	              self.setupStreamHandler_(call);
	            }
	          } else {
	            var call = self.peer.call(peer_id, self.stream);
	            console.log("peer.call called from generic media exchange startCall_");
	            self.peers[peer_id].call = call;
	            self.setupStreamHandler_(call);
	          }
	        })(self);
	      };
	
	      // 新規に接続してきたpeerからのcallを受け付けるハンドラ
	      if (!this.peer._events.call || this.peer._events.call.length === 0) {
	        this.peer.on('call', function (call) {
	          if (!self.peers[call.peer]) {
	            self.peers[call.peer] = {};
	          }
	          if (call.metadata && call.metadata.type === 'screen') {
	            self.peers[call.peer].screen_receiver = call;
	            call.answer();
	            self.setupStreamHandler_(call);
	          } else {
	            self.peers[call.peer].call = call;
	            call.answer(self.stream);
	            self.setupStreamHandler_(call);
	            if (self.screenStream !== undefined) {
	              var call = self.peer.call(call.peer, self.screenStream, { metadata: { type: 'screen' } });
	              self.peers[call.peer].screen_sender = call;
	            }
	            console.log("peer.call called from call callback");
	          }
	        });
	      }
	    }
	
	    // peerからのvideo stream, closeに対し、ハンドラをセットする
	
	  }, {
	    key: 'setupStreamHandler_',
	    value: function setupStreamHandler_(call) {
	      var self = this;
	      var isReconnect = !!(call.metadata && call.metadata.reconnect);
	
	      call.on('stream', function (stream) {
	        if (call.metadata && call.metadata.type === 'screen') {
	          self.peers[this.peer].screen_receiver.stream = stream;
	          self.setupPeerScreen_(this.peer, stream, isReconnect);
	        } else {
	          self.peers[this.peer].call.stream = stream;
	          self.setupPeerVideo_(this.peer, stream, isReconnect);
	        }
	      }).on('close', function () {
	        // handle peer close event
	        // check skyway server to see this user is disconnected.
	
	
	        var peer_id = this.peer;
	        var metadata = this.metadata;
	        var isScreenShare = !!(metadata && metadata.type === 'screen');
	        var isSSCaller = self.peers[this.peer].screen_sender && self.peers[this.peer].screen_sender.id === this.id;
	        self.listAllPeers(function (list) {
	          var isDisconnected = true;
	          for (var index in list) {
	            if (list[index] === peer_id) {
	              isDisconnected = false;
	              break;
	            }
	          }
	          if (isDisconnected || isScreenShare) {
	            if (isScreenShare) {
	              // don't emit ss_close if you're the sender
	              if (!isSSCaller) {
	                self.fire_('ss_close', peer_id);
	              }
	            } else {
	              self.fire_('ms_close', peer_id);
	            }
	            // check if user has any other open connections
	            if (self.peers[peer_id] && (self.peers[peer_id].call === undefined || !self.peers[peer_id].call.open) && (self.peers[peer_id].DCconn === undefined || !self.peers[peer_id].DCconn.open) && (self.peers[peer_id].screen_sender === undefined || !self.peers[peer_id].screen_sender.open)) {
	              self.removePeer(peer_id);
	            }
	          } else {
	            // leave reconnecting up to startPollingConnections_
	          }
	        });
	      });
	    }
	
	    // peerのvideoのObjectURLを生成し、frontにpeer_msイベントを返す
	
	  }, {
	    key: 'setupPeerVideo_',
	    value: function setupPeerVideo_(peer_id, stream, isReconnect) {
	      // prevent to call twice.
	      // if(!!this.peers[peer_id].video) return;
	
	      var url = window.URL.createObjectURL(stream);
	
	      // set isReconnect as boolean
	      isReconnect = !!isReconnect;
	
	      this.peers[peer_id].video = stream;
	      this.fire_('peer_ms', { id: peer_id, src: url, reconnect: isReconnect });
	    }
	
	    // peerのvideo Nodeをセットアップする
	    // loadedmetadataが完了したら、'peer_video'をfireする
	
	  }, {
	    key: 'setupPeerScreen_',
	    value: function setupPeerScreen_(peer_id, stream, isReconnect) {
	      var self = this;
	      if (!isReconnect) {
	        isReconnect = false;
	      }
	
	      self.peers[peer_id].screen_receiver.video = stream;
	      self.fire_('peer_ss', { src: URL.createObjectURL(stream), id: peer_id, reconnect: isReconnect });
	    }
	
	    // peerのdcとmcを全てクローズする
	
	  }, {
	    key: 'removePeer',
	    value: function removePeer(peer_id) {
	      try {
	        if (this.peers[peer_id] !== undefined) {
	          var peer = this.peers[peer_id];
	          if (peer.call) {
	            peer.call.close();
	          }
	          if (peer.screen_sender) {
	            peer.screen_sender.close();
	          }
	          if (peer.screen_receiver) {
	            peer.screen_receiver.close();
	          }
	          if (peer.DCconn) {
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
	
	  }, {
	    key: 'startDataChannel_',
	    value: function startDataChannel_() {
	      this.startDCconnection_();
	    }
	
	    // DataChannelのコネクション処理を行う
	
	  }, {
	    key: 'startDCconnection_',
	    value: function startDCconnection_() {
	      var self = this;
	
	      // API経由で取得したIDには、自分からconnectする
	      for (var peer_id in this.peers) {
	        this.DCconnect_(peer_id);
	      }
	
	      //新規に接続してきたpeerからのconnection要求を受け付けるハンドラ
	      this.peer.on('connection', function (conn) {
	        if (!self.peers[conn.peer]) {
	          self.peers[conn.peer] = {};
	        }
	        self.peers[conn.peer].DCconn = conn;
	
	        self.setupDCHandler_(conn);
	        self.fire_('dc_open', conn.peer);
	      });
	    }
	
	    // DataChannelのコネクション処理を行う
	
	  }, {
	    key: 'DCconnect_',
	    value: function DCconnect_(peer_id) {
	      var conn = this.peer.connect(peer_id, { "serialization": this.opts.serialization, "reliable": this.opts.reliable });
	      this.peers[peer_id].DCconn = conn;
	
	      conn.on('open', function () {
	        this.setupDCHandler_(conn);
	        this.fire_('dc_open', conn.peer);
	      }.bind(this));
	    }
	
	    // DataChannelのイベントハンドラをセットする
	
	  }, {
	    key: 'setupDCHandler_',
	    value: function setupDCHandler_(conn) {
	      var self = this;
	      conn.on('data', function (data) {
	        self.fire_('message', { "id": this.peer, "data": data });
	      }).on('close', function () {
	        // handle peer close event
	        // check skyway server to see this user is disconnected.
	        var peer_id = this.peer;
	        self.listAllPeers(function (list) {
	          var isDisconnected = true;
	          for (var index in list) {
	            if (list[index] === peer_id) {
	              isDisconnected = false;
	              break;
	            }
	          }
	          if (isDisconnected) {
	            self.fire_('dc_close', peer_id);
	            // check if user has any other open connections
	            if (self.peers[peer_id] && (self.peers[peer_id].call === undefined || !self.peers[peer_id].call.open) && (self.peers[peer_id].DCconn === undefined || !self.peers[peer_id].DCconn.open) && (self.peers[peer_id].screen_sender === undefined || !self.peers[peer_id].screen_sender.open)) {
	              self.removePeer(peer_id);
	            }
	          } else {
	            // leave reconnecting up to startPollingConnections_
	          }
	        });
	      });
	    }
	
	    // DataChannelでつながっているpeerにメッセージを送信する
	
	  }, {
	    key: 'send_',
	    value: function send_(data) {
	      if (!this.peer) {
	        return false;
	      }
	
	      if (data && typeof data === "string" && data.length === 0) {
	        return false;
	      }
	
	      if (data && (typeof data === "string" || (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === "object")) {
	        for (var peer_id in this.peers) {
	          if (this.peers[peer_id].DCconn) {
	            this.peers[peer_id].DCconn.send(data);
	          }
	        }
	      }
	    }
	
	    // イベントを発火する
	
	  }, {
	    key: 'fire_',
	    value: function fire_(name, obj) {
	      this.emit(name, obj);
	    }
	
	    ////////////////////////////////////
	    // public method
	
	  }, {
	    key: 'start',
	    value: function start() {
	      var self = this;
	      setTimeout(function () {
	        self.conn2SkyWay_();
	      }, 0);
	      return self;
	    }
	  }, {
	    key: 'send',
	    value: function send(data) {
	      if (this.peer) this.send_(data);
	    }
	
	    // 切断する
	
	  }, {
	    key: 'close',
	    value: function close() {
	      if (this.peer) this.peer.destroy();
	      clearInterval(this.pollInterval);
	    }
	
	    // 画面共有を開始する
	
	  }, {
	    key: 'startScreenShare',
	    value: function startScreenShare(success, error) {
	      if (this.peer) {
	        var self = this;
	        if (SkyWay && SkyWay.ScreenShare) {
	          var sc = new SkyWay.ScreenShare();
	          if (sc.isEnabledExtension()) {
	            sc.startScreenShare({
	              Width: screen.width,
	              Height: screen.height,
	              FrameRate: 5
	            }, function (stream) {
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
	
	  }, {
	    key: 'stopScreenShare',
	    value: function stopScreenShare() {
	      if (this.screenStream) {
	        this.screenStream.getVideoTracks()[0].stop();
	        for (var peer_id in this.peers) {
	          if (this.peers[peer_id].screen_sender) {
	            this.peers[peer_id].screen_sender.close();
	          }
	          delete this.peers[peer_id].screen_sender;
	        }
	        this.screenStream = undefined;
	      }
	    }
	
	    // 同じRoomのpeer listを取得
	
	  }, {
	    key: 'listAllPeers',
	    value: function listAllPeers(callback) {
	      var self = this;
	      this.peer.listAllPeers(function (peers) {
	        var roomPeers = [];
	        peers.forEach(function (peer_id) {
	          // peer_idが自分のidではなく、かつ、peer_idの接頭辞がroom_idの場合
	          if (peer_id !== self.opts.id && peer_id.indexOf(self.opts.room_id) === 0) {
	            roomPeers.push(peer_id);
	          }
	        });
	        callback(roomPeers);
	      });
	    }
	
	    // ユーザに再接続する
	
	  }, {
	    key: 'reconnect',
	    value: function reconnect(peer_id, connections) {
	      var self = this;
	      var peer = self.peers[peer_id];
	      if (connections === undefined) {
	        connections = {
	          video: true,
	          screen: true,
	          data: true
	        };
	      }
	      if (peer) {
	        if (connections.video) {
	          if (peer.call && peer.call.close) {
	            peer.call.close();
	          }
	          var call = self.peer.call(peer_id, self.stream, { metadata: { reconnect: true } });
	
	          console.log("peer.call called from reconnect method");
	          peer.call = call;
	          self.setupStreamHandler_(call);
	        }
	        if (connections.screen) {
	          if (self.screenStream) {
	            if (peer.screen_sender && peer.screen_sender.close) {
	              peer.screen_sender.close();
	            }
	            var call = self.peer.call(peer_id, self.screenStream, { metadata: { reconnect: true, type: 'screen' } });
	            console.log("peer.call called from reconnect method in screenshare");
	            peer.screen_sender = call;
	          }
	        }
	        if (connections.data) {
	          if (peer.DCconn && peer.DCconn.close) {
	            peer.DCconn.close();
	          }
	          var conn = this.peer.connect(peer_id, {
	            "serialization": this.opts.serialization,
	            "reliable": this.opts.reliable,
	            "metadata": { reconnect: true }
	          }).on('open', function () {
	            peer.DCconn = conn;
	            self.setupDCHandler_(conn);
	          });
	        }
	      }
	    }
	  }]);
	
	  return MultiParty;
	}(EventEmitter);
	
	MultiParty.util = util;
	
	module.exports = MultiParty;

/***/ },
/* 3 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];
	
	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/////////////////////////////////////
	// utility
	var md5 = __webpack_require__(5);
	
	var util = {};
	
	// オプションのチェック
	util.checkOpts_ = function (opts_) {
	  var opts = {};
	
	  // key check (なかったら throw)
	  if (!opts_.key || typeof opts_.key !== "string") {
	    throw "app key must be specified";
	  };
	
	  // key check ( string patter がマッチしなかったら throw )
	  if (!opts_.key.match(/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/)) {
	    throw "wrong string pattern of app key";
	  };
	  // copy key
	  opts.key = opts_.key;
	
	  // todo : room prefix にdomainを意識したほげほげ
	  // room check (なかったら "")
	  if (!opts_.room || typeof opts_.room !== "string") {
	    var seed = "";
	  } else if (!opts_.room.match(/^[0-9a-zA-Z\-\_]{4,32}$/)) {
	    throw "room name should be digit|alphabet and length between 4 and 32";
	  } else {
	    var seed = opts_.room;
	  };
	
	  opts.room_name = seed;
	
	  opts.room_id = util.makeRoomName(seed);
	
	  // id check (なかったら生成）
	
	  var hash_ = location.pathname + "_" + opts.room_id + "_peer_id";
	  if (!!sessionStorage[hash_]) {
	    opts.id = sessionStorage[hash_];
	  } else if (!opts_.id || typeof opts_.id !== "string") {
	    opts.id = opts.room_id + util.makeID();
	  } else {
	    opts.id = opts.room_id + opts_.id;
	  }
	  sessionStorage[hash_] = opts.id;
	
	  // reliable check (なかったら false)
	  if (!opts_.reliable) {
	    opts.reliable = false;
	  } else {
	    opts.reliable = true;
	  }
	
	  // serialization check (未指定なら binary)
	  if (!opts_.serialization) {
	    opts.serialization = "binary";
	  } else {
	    // serializationのタイプをチェックする
	    // binary, utf-8, json以外はエラー
	    opts.serialization = opts_.serialization;
	  }
	
	  // stream check
	  opts.video_stream = opts_.video === undefined ? true : opts_.video;
	  opts.audio_stream = opts_.audio === undefined ? true : opts_.audio;
	  opts.use_stream = opts.video_stream || opts.audio_stream;
	
	  // polling disconnect/reconnect (must for FF)
	  opts.polling = opts_.polling === undefined ? true : opts_.polling;
	  opts.polling_interval = opts_.polling_interval === undefined ? 3000 : opts_.polling_interval;
	
	  // peerjs options
	  opts.peerjs_opts = {
	    debug: opts_.debug || false,
	    key: opts.key
	  };
	  if (opts_.host) {
	    opts.peerjs_opts.host = opts_.host;
	  }
	  if (opts_.port) {
	    opts.peerjs_opts.port = opts_.port;
	  }
	  if (opts_.secure) {
	    opts.peerjs_opts.secure = opts_.secure;
	  }
	  if (opts_.config) {
	    opts.peerjs_opts.config = opts_.config;
	  }
	
	  return opts;
	};
	
	// IDを作る
	util.makeID = function () {
	  var id = "";
	
	  for (var i = 0; i < 32; i++) {
	    // id += String.fromCharCode( (Math.random() * (125 - 33) + 33) | 0)
	    id += String.fromCharCode(Math.random() * (57 - 48) + 48 | 0);
	  }
	  return id;
	};
	
	// room名を作る
	util.makeRoomName = function (seed) {
	  seed = seed || "";
	  seed += location.host + location.pathname;
	  return md5(seed).substring(0, 6) + "R_";
	};
	
	// video nodeを作る
	util.createVideoNode = function (video) {
	  // 古いノードが会った場合は削除
	  var prev_node = document.getElementById(video.id);
	  if (prev_node) prev_node.parentNode.removeChild(prev_node);
	
	  // 表示用のビデオノードを作る
	  var v_ = document.createElement("video");
	  v_.setAttribute("src", video.src);
	  v_.setAttribute("id", video.id);
	
	  var played = false;
	
	  v_.addEventListener("loadedmetadata", function (ev) {
	    if (!played) {
	      played = true;
	      this.play();
	    }
	  }, false);
	
	  // since FF37 sometimes doesn't fire "loadedmetadata"
	  // work around is after 500msec, calling play();
	  setTimeout(function (ev) {
	    if (!played) {
	      played = true;
	      v_.play();
	    }
	  }, 500);
	
	  return v_;
	};
	
	module.exports = util;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	(function(){
	  var crypt = __webpack_require__(6),
	      utf8 = __webpack_require__(7).utf8,
	      isBuffer = __webpack_require__(8),
	      bin = __webpack_require__(7).bin,
	
	  // The core
	  md5 = function (message, options) {
	    // Convert to byte array
	    if (message.constructor == String)
	      if (options && options.encoding === 'binary')
	        message = bin.stringToBytes(message);
	      else
	        message = utf8.stringToBytes(message);
	    else if (isBuffer(message))
	      message = Array.prototype.slice.call(message, 0);
	    else if (!Array.isArray(message))
	      message = message.toString();
	    // else, assume byte array already
	
	    var m = crypt.bytesToWords(message),
	        l = message.length * 8,
	        a =  1732584193,
	        b = -271733879,
	        c = -1732584194,
	        d =  271733878;
	
	    // Swap endian
	    for (var i = 0; i < m.length; i++) {
	      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |
	             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;
	    }
	
	    // Padding
	    m[l >>> 5] |= 0x80 << (l % 32);
	    m[(((l + 64) >>> 9) << 4) + 14] = l;
	
	    // Method shortcuts
	    var FF = md5._ff,
	        GG = md5._gg,
	        HH = md5._hh,
	        II = md5._ii;
	
	    for (var i = 0; i < m.length; i += 16) {
	
	      var aa = a,
	          bb = b,
	          cc = c,
	          dd = d;
	
	      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);
	      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);
	      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);
	      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);
	      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);
	      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);
	      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);
	      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);
	      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);
	      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);
	      c = FF(c, d, a, b, m[i+10], 17, -42063);
	      b = FF(b, c, d, a, m[i+11], 22, -1990404162);
	      a = FF(a, b, c, d, m[i+12],  7,  1804603682);
	      d = FF(d, a, b, c, m[i+13], 12, -40341101);
	      c = FF(c, d, a, b, m[i+14], 17, -1502002290);
	      b = FF(b, c, d, a, m[i+15], 22,  1236535329);
	
	      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);
	      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);
	      c = GG(c, d, a, b, m[i+11], 14,  643717713);
	      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);
	      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);
	      d = GG(d, a, b, c, m[i+10],  9,  38016083);
	      c = GG(c, d, a, b, m[i+15], 14, -660478335);
	      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);
	      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);
	      d = GG(d, a, b, c, m[i+14],  9, -1019803690);
	      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);
	      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);
	      a = GG(a, b, c, d, m[i+13],  5, -1444681467);
	      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);
	      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);
	      b = GG(b, c, d, a, m[i+12], 20, -1926607734);
	
	      a = HH(a, b, c, d, m[i+ 5],  4, -378558);
	      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);
	      c = HH(c, d, a, b, m[i+11], 16,  1839030562);
	      b = HH(b, c, d, a, m[i+14], 23, -35309556);
	      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);
	      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);
	      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);
	      b = HH(b, c, d, a, m[i+10], 23, -1094730640);
	      a = HH(a, b, c, d, m[i+13],  4,  681279174);
	      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);
	      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);
	      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);
	      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);
	      d = HH(d, a, b, c, m[i+12], 11, -421815835);
	      c = HH(c, d, a, b, m[i+15], 16,  530742520);
	      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);
	
	      a = II(a, b, c, d, m[i+ 0],  6, -198630844);
	      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);
	      c = II(c, d, a, b, m[i+14], 15, -1416354905);
	      b = II(b, c, d, a, m[i+ 5], 21, -57434055);
	      a = II(a, b, c, d, m[i+12],  6,  1700485571);
	      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);
	      c = II(c, d, a, b, m[i+10], 15, -1051523);
	      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);
	      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);
	      d = II(d, a, b, c, m[i+15], 10, -30611744);
	      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);
	      b = II(b, c, d, a, m[i+13], 21,  1309151649);
	      a = II(a, b, c, d, m[i+ 4],  6, -145523070);
	      d = II(d, a, b, c, m[i+11], 10, -1120210379);
	      c = II(c, d, a, b, m[i+ 2], 15,  718787259);
	      b = II(b, c, d, a, m[i+ 9], 21, -343485551);
	
	      a = (a + aa) >>> 0;
	      b = (b + bb) >>> 0;
	      c = (c + cc) >>> 0;
	      d = (d + dd) >>> 0;
	    }
	
	    return crypt.endian([a, b, c, d]);
	  };
	
	  // Auxiliary functions
	  md5._ff  = function (a, b, c, d, x, s, t) {
	    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._gg  = function (a, b, c, d, x, s, t) {
	    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._hh  = function (a, b, c, d, x, s, t) {
	    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	  md5._ii  = function (a, b, c, d, x, s, t) {
	    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
	    return ((n << s) | (n >>> (32 - s))) + b;
	  };
	
	  // Package private blocksize
	  md5._blocksize = 16;
	  md5._digestsize = 16;
	
	  module.exports = function (message, options) {
	    if (message === undefined || message === null)
	      throw new Error('Illegal argument ' + message);
	
	    var digestbytes = crypt.wordsToBytes(md5(message, options));
	    return options && options.asBytes ? digestbytes :
	        options && options.asString ? bin.bytesToString(digestbytes) :
	        crypt.bytesToHex(digestbytes);
	  };
	
	})();


/***/ },
/* 6 */
/***/ function(module, exports) {

	(function() {
	  var base64map
	      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
	
	  crypt = {
	    // Bit-wise rotation left
	    rotl: function(n, b) {
	      return (n << b) | (n >>> (32 - b));
	    },
	
	    // Bit-wise rotation right
	    rotr: function(n, b) {
	      return (n << (32 - b)) | (n >>> b);
	    },
	
	    // Swap big-endian to little-endian and vice versa
	    endian: function(n) {
	      // If number given, swap endian
	      if (n.constructor == Number) {
	        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
	      }
	
	      // Else, assume array and swap all items
	      for (var i = 0; i < n.length; i++)
	        n[i] = crypt.endian(n[i]);
	      return n;
	    },
	
	    // Generate an array of any length of random bytes
	    randomBytes: function(n) {
	      for (var bytes = []; n > 0; n--)
	        bytes.push(Math.floor(Math.random() * 256));
	      return bytes;
	    },
	
	    // Convert a byte array to big-endian 32-bit words
	    bytesToWords: function(bytes) {
	      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
	        words[b >>> 5] |= bytes[i] << (24 - b % 32);
	      return words;
	    },
	
	    // Convert big-endian 32-bit words to a byte array
	    wordsToBytes: function(words) {
	      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
	        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
	      return bytes;
	    },
	
	    // Convert a byte array to a hex string
	    bytesToHex: function(bytes) {
	      for (var hex = [], i = 0; i < bytes.length; i++) {
	        hex.push((bytes[i] >>> 4).toString(16));
	        hex.push((bytes[i] & 0xF).toString(16));
	      }
	      return hex.join('');
	    },
	
	    // Convert a hex string to a byte array
	    hexToBytes: function(hex) {
	      for (var bytes = [], c = 0; c < hex.length; c += 2)
	        bytes.push(parseInt(hex.substr(c, 2), 16));
	      return bytes;
	    },
	
	    // Convert a byte array to a base-64 string
	    bytesToBase64: function(bytes) {
	      for (var base64 = [], i = 0; i < bytes.length; i += 3) {
	        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
	        for (var j = 0; j < 4; j++)
	          if (i * 8 + j * 6 <= bytes.length * 8)
	            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
	          else
	            base64.push('=');
	      }
	      return base64.join('');
	    },
	
	    // Convert a base-64 string to a byte array
	    base64ToBytes: function(base64) {
	      // Remove non-base-64 characters
	      base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');
	
	      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
	          imod4 = ++i % 4) {
	        if (imod4 == 0) continue;
	        bytes.push(((base64map.indexOf(base64.charAt(i - 1))
	            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
	            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
	      }
	      return bytes;
	    }
	  };
	
	  module.exports = crypt;
	})();


/***/ },
/* 7 */
/***/ function(module, exports) {

	var charenc = {
	  // UTF-8 encoding
	  utf8: {
	    // Convert a string to a byte array
	    stringToBytes: function(str) {
	      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
	    },
	
	    // Convert a byte array to a string
	    bytesToString: function(bytes) {
	      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
	    }
	  },
	
	  // Binary encoding
	  bin: {
	    // Convert a string to a byte array
	    stringToBytes: function(str) {
	      for (var bytes = [], i = 0; i < str.length; i++)
	        bytes.push(str.charCodeAt(i) & 0xFF);
	      return bytes;
	    },
	
	    // Convert a byte array to a string
	    bytesToString: function(bytes) {
	      for (var str = [], i = 0; i < bytes.length; i++)
	        str.push(String.fromCharCode(bytes[i]));
	      return str.join('');
	    }
	  }
	};
	
	module.exports = charenc;


/***/ },
/* 8 */
/***/ function(module, exports) {

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	module.exports = function (obj) {
	  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
	}
	
	function isBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}
	
	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
	}


/***/ }
/******/ ]);
//# sourceMappingURL=multiparty.js.map