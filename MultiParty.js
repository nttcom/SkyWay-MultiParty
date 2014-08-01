/**
 * MultiParty.js
 *
 * SkyWayで簡単にマルチパーティ接続を実現するライブラリ
 */


(function(global){
  // オブジェクトの宣言
  if (!global.MultiParty) {
    global.MultiParty = null;
  }


  var MultiParty_ = function(opts){
    this.opts = opts;

    this.open_();
  }

  // EventEmitterを継承する
  MultiParty_.prototype = new EventEmitter2();

  //
  MultiParty_.prototype.open_ = function(){
  }

  MultiParty_.prototype.close = function(){
  }
}(window));


