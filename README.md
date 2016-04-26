# Multi Party

[日本語](./README.md) | [English](./README.en.md)

SkyWay( http://nttcom.github.io/skyway/ )を用い、多人数参加のグループビデオチャットを簡単に開発できるライブラリです。

## サンプル

```javascript
// MultiParty インスタンスを生成
multiparty = new MultiParty( {
  "key": "********-****-****-****-************"  /* SkyWay keyを指定 */,
  "reliable": true /* data channel でreliable通信(sctp)を行う */
});

// for MediaStream
//

multiparty.on('my_ms', function(video) {
  // 自分のvideoを表示
  var vNode = MultiParty.util.createVideoNode(video);
  vNode.volume = 0;
  $(vNode).appendTo("#streams");
}).on('peer_ms', function(video) {
  // peerのvideoを表示
  var vNode = MultiParty.util.createVideoNode(video);
  $(vNode).appendTo("#streams");
}).on('ms_close', function(peer_id) {
  // peerが切れたら、対象のvideoノードを削除する
  $("#"+peer_id).remove();
})


// for DataChannel
//

$("button").on('click', function(ev) {
  multiparty.send('hello'); /* 接続中のピアにメッセージを送信 */
});

multiparty.on('message', function(mesg) {
  $("p.receive").append(mesg.data + "<br>"); /* 相手から受信したメッセージを表示 */
});

// サーバとpeerに接続
multiparty.start()
```

## サンプルページ

* [https://nttcom.github.io/SkyWay-MultiParty/examples/multiparty-sample.html](https://nttcom.github.io/SkyWay-MultiParty/examples/multiparty-sample.html)
( [HTML](https://github.com/nttcom/SkyWay-MultiParty/blob/master/examples/multiparty-sample.html) )

## ダウンロード

* [development version](https://skyway.io/dist/multiparty.js)
* [minified version](https://skyway.io/dist/multiparty.min.js)

## APIリファレンス

### MultiParty

```javascript
var multiparty = new MultiParty([options]);
```


* options
    * key (string)
        * API key([skyway](https://skyway.io/ds/)から取得)。**必須**。
    * room (string)
        * ルーム名。
    *  id (string)
        * ユーザID。
    * reliable (boolean)
        * **true** : データチャンネルで信頼性のあるデータ転送を行う。デフォルト値はfalse。
    * selialization (string)
        * データシリアライゼーションモードを( binary | binary-utf8 | json | none )のいずれかにセットする。デフォルト値はbinary。
    * video (boolean)
        * **true** : ビデオストリーミングを許可する。デフォルト値はtrue。
    * audio (boolean)
        * **true** : オーディオストリーミングを許可する。デフォルト値はtrue。
    * polling (boolean)
        * **true** : サーバポーリングによるユーザリストのチェックを許可する。デフォルト値はtrue。
    * polling_interval (number)
        * ポーリング間隔(msec)を設定する。デフォルト値は3000。
    * debug (number)
        * コンソールに表示されるデバッグログレベルを設定する。
    ```
    0 ログを表示ない
    1 エラーだけ表示
    2 エラーと警告だけ表示
    3 すべてのログを表示
    ```
    * host (string)
        * peerサーバのホスト名。
    * port (number)
        * peerサーバのポート番号。
    * secure (boolean)
        * true: peerサーバとの接続にTLSを使用する。
    * config (object).
        * RTCPeerConnectionに渡されるオプション。ICEサーバの設定を行うことができる。初期値は```{ 'iceServers': [{ 'url': 'stun:stun.skyway.io:3478' }] }```

### start

SkyWayサーバに接続し、peerに接続します。

### multiparty.on

各種イベント発生時のコールバックを設定できます。

```javascript
multiparty.on(event, callback);
```

#### 'open'
```javascript
multiparty.on('open', function(myid){ ... });
```
* SkyWayサーバとのコネクションが確立した際に発生します。
* **id** : 現在のウィンドウのid

#### 'my_ms'
```javascript
multiparty.on('my_ms', function({"src": <object url>, "id": <myid>}){...});
```
* このウィンドウのvideo/audioストリームのセットアップが完了した際に発生します。
* **object url** : キャプチャされたストリームのurl。
* **id** : 現在のウィンドウのid。

#### 'peer_ms'
```javascript
multiparty.on('peer_ms', function({"src": <object url>, "id": <peer-id>, "reconnect": <true or false>}){ ... });
```
* peerのvideo/audioストリームのセットアップが完了した際に発生します。
* **src** : peerのストリームのオブジェクトURL。
* **id** : peerのid。
* **reconnect** : reconnectメソッドにより再接続された場合はtrueとなる。

#### 'peer_ss'
```javascript
multiparty.on('peer_ss', function({"src": <object url>, "id": <peer-id>, "reconnect": <true or false>}){ ... });
```
* peerのスクリーンキャプチャストリームのセットアップが完了した際に発生します。
* **src** : peerのスクリーンキャプチャストリームのオブジェクトURL。
* **id** : peerのid。
* **reconnect** :

#### 'ms_close'
```javascript
multiparty.on('ms_close', function(peer-id){ ... });
```
* peerのメディアストリームがクローズした際に発生します。
* **peer-id** : peerのid。

#### 'ss_close'
```javascript
multiparty.on('ss_close', function(peer-id){ ... });
```
* peerのスクリーンキャストストリームがクローズした際に発生します。
* **peer-id** : peerのid。

#### 'dc_open'
```javascript
multiparty.on('dc_open', function(peer-id){ ... });
```
* データチャンネルのコネクションのセットアップが完了した際に発生します。
* **peer-id** : peerのid。

#### 'message'
```javascript
multiparty.on('message', function({"id": <peer-id>, "data": <data>}){ ... });
```
* peerからメッセージを受信した際に発生します。
* **peer-id** : peerのid。
* **data** : 受信したデータ。

#### 'dc_close'
```javascript
multiparty.on('dc_close', function(peer-id){ ... });
```
* データコネクションがクローズした際に発生します。
* **peer-id** : peerのid。

#### 'error'
```javascript
multiparty.on('error', function(error){ ... });
```
* エラーが起きたら発生します。
* **error** : 発生したErrorオブジェクト。

### mute

自分の映像と音声をミュートすることができます。

```javascript
multiparty.mute({"video": <true of false>, "audio": <true or false>);
```


### unmute

自分の映像と音声をアンミュートすることができます。

```javascript
multiparty.unmute({"video": <true of false>, "audio": <true or false>);
```


### removePeer

peerのメディアストリームとデータストリームをクローズします。

```javascript
multiparty.removePeer(peer-id);
```

### send

peerにデータを送信します。

```javascript
multiparty.send(data);
```


### close

コネクションを全て切断します。

```javascript
multiparty.close();
```

### startScreenShare

画面共有を開始します。

```javascript
multiparty.startScreenShare(function(stream){
  // success callback
}, function(err) {
  // error callback
});
```

### stopScreenShare

画面共有を中断します。

```javascript
multiparty.stopScreenShare();
```

### listAllPeers

接続しているpeerのidを取得します。

```javascript
multiparty.listAllPeers(function(lists) { ... });
```

### reconnect

なんらかの原因でコネクションが切れてしまったpeerに再接続を行います。

```javascript
multiparty.reconnect(peer_id, function({"video": <boolean>, "screen": <boolean>, "data": <boolean>}){ ... });
```

### MultiParty.util.createVideoNode

オブジェクトURLからビデオノードを生成できます。

```javascript
var vNode = MultiParty.util.createVideoNode({"src": object_url, "id": peer_id}){ ... });
```

## LICENSE & Copyright

[LICENSE](https://github.com/nttcom/SkyWay-MultiParty/blob/master/LICENSE)
