# Multi Party

[日本語](./README.md) | [English](./README.en.md)

## descrption

SkyWay( http://nttcom.github.io/skyway/ )を用い、マルチパーティのビデオチャットを簡単に開発できるライブラリ。

## sample snipet

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
```

## sample site

- https://komasshu-skyway-sample.github.io/plugins/examples/multiparty.html
( [HTML](https://github.com/komasshu-skyway-sample/plugins/blob/master/examples/multiparty.html) )

## library

- [development version](https://raw.githubusercontent.com/komasshu-skyway-sample/plugins/master/multiparty/dist/multiparty.js)
- [minified version](https://raw.githubusercontent.com/komasshu-skyway-sample/plugins/master/multiparty/dist/multiparty.min.js)

## API reference

### MultiParty

```javascript
var multiparty = new MultiParty([options]);
```

- options
  - key (string)
    - an API key obtained from [skyway](https://skyway.io/ds/)
  - room (string)
    - room name
  -  id (string)
    - user id
  - reliable (boolean)
    - **true** indicates reliable data transfer (data channel). ```default : false```
  - selialization (string)
    - set data selialization mode ( binary | binary-utf8 | json | none ). ```default : binary```
  - video (boolean)
    - **true** indicates video streaming is enabled.```default: true```
  - audio (boolean)
    - **true** indicates audio streaming is enabled. ```default: true```
  - polling (boolean)
    - **true** indicates check user list via server polling. ```default: true```
  - polling_interval (number)
    - polling interval in msec order. ```default: 3000```
  - debug (number)
    - debug log level appeared in console.

    ```
    0 Prints no logs.
    1 Prints only errors.
    2 Prints errors and warnings.
    3 Prints all logs.
    ```
  - host (string)
    - peer server host name.
  - port (number)
    - peer server port number.
  - secure (boolean)
    - true means peer server provide tls.
  - config (object)
    - passed to RTCPeerConnection. it indicates custom ICE server configuration. Defaults to ```{ 'iceServers': [{ 'url': 'stun:stun.skyway.io:3478' }] }```.

### multiparty.on

```javascript
multiparty.on(event, callback);
```

- 'open'
```javascript
multiparty.on('open', function(myid){ ... });
```
  - Emitted when a connection to SkyWay server has established. **id** indicates id of current window.
- 'my_ms'
```javascript
multiparty.on('my_ms', function({"src": <object url>, "id": <myid>}){...});
```
  - Emitted when this window's video/audio stream has setuped. **object url** is the url for captured stream. **id** is current window's id.
- 'peer_ms'
```javascript
multiparty.on('peer_ms', function({"src": <object url>, "id": <peer-id>, "reconnect": <true or false>}){ ... });
```
  - Emitted when peer's av stream has setuped.
- 'peer_ss'
```javascript
multiparty.on('peer_ss', function({"src": <object url>, "id": <peer-id>, "reconnect": <true or false>}){ ... });
```
  - Emitted when peer's screen captrure stream has setuped.
- 'ms_close'
```javascript
multiparty.on('ms_close', function(peer-id){ ... });
```
  - Emitted when peer's media stream has closed.
- 'ss_close'
```javascript
multiparty.on('ss_close', function(peer-id){ ... });
```
  - Emitted when peer's screen cast stream has closed.
- 'dc_open'
```javascript
multiparty.on('dc_open', function(peer-id){ ... });
```
  - Emitted when the connection for data channel with peer is setuped.
- 'message'
```javascript
multiparty.on('message', function({"id": <peer-id>, "data": <data>}){ ... });
```
  - Emitted when receive message from peer.
- 'dc_close'
```javascript
multiparty.on('dc_close', function(peer-id){ ... });
```
  - Emitted when data connection has closed with peer.

### mute

```javascript
multiparty.mute({"video": <true of false>, "audio": <true or false>);
```

### unmute

```javascript
multiparty.unmute({"video": <true of false>, "audio": <true or false>);
```

### removePeer

```javascript
multiparty.removePeer(peer-id);
```

### send

```javascript
multiparty.send(data);
```

### close

```javascript
multiparty.close();
```

### startScreenShare

```javascript
multiparty.startScreenShare(function(stream){
  // success callback
}, function(err) {
  // error callback
});

### stopScreenShare

```javascript
multiparty.stopScreenShare();
```

### listAllPeers

```javascript
multiparty.listAllPeers(function(lists) { ... });
```

### reconnect

```javascript
multiparty.reconnect(peer_id, function({"video": <boolean>, "screen": <boolean>, "data": <boolean>}){ ... });
```

### createVideoNode

```javascript
var vNode = multiparty.createVideoNode({"src": object_url, "id": peer_id}){ ... });
```


### how to indicate other ICE servers

```javascript
      multiparty = new MultiParty( {
        "key": "737ae99a-5d87-11e3-9c76-1506fbcc2da2",
        "config": { 'iceServers': [{ 'url': 'stun:stun.skyway.io:3478' }] }
      });
```

## known issues

- Fixed : ~~FireFoxで、映像ストリームがうまく動作しません。~~

## Copyright

&copy; Kensaku Komatsu (kensaku.komatsu@gmail.com) 2014

## license

MIT
