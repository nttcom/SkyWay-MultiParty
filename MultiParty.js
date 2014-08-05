/**
 * MultiParty.js
 *
 * SkyWayで簡単にマルチパーティ接続を実現するライブラリ
 */


(function(global){


  // コンストラクタ
  var MultiParty_ = function(opts){
    this.room = null; // ルーム名
    this.id = null; // ID
    this.key = null; // app key
    this.peers = []; // peer IDs

    this.opts_ = opts;
    
    // option をチェック
    // room, myid, key プロパティを割り当てる
    this.checkOpts_();

    console.log(this);

    this.open_();
  }

  // EventEmitterを継承する
  MultiParty_.prototype = new EventEmitter2();

  ///////////////////////////////////
  // private method

  // SkyWayサーバーに繋ぐ
  MultiParty_.prototype.open_ = function() {
    console.log(this.id);
    this.peer = new Peer(this.id, {key: this.key});

    // SkyWayサーバーへの接続が完了したら、open イベントを起こす
    this.peer.on('open', function(id) {
      // todo: error check
      
      this.id = id;

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
    xhr.open('GET', 'https://skyway.io/v2/active/list/' + this.key);

    xhr.onload = function(ev) {
      // todo: error処理
      
      this.peers = JSON.parse(xhr.responseText);

      this.fire_('open');
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


