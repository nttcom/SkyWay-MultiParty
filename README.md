# Multi Party

## descrption

SkyWay( http://nttcom.github.io/skyway/ )を用い、マルチパーティのビデオチャットを簡単に開発できるライブラリ。

## sample code

```javascript
// MultiParty インスタンスを生成
multiparty = new MultiParty( {
  "key": "737ae99a-5d87-11e3-9c76-1506fbcc2da2"  /* SkyWay keyを指定 */
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

https://komasshu-skyway-sample.github.io/plugins/examples/multiparty.html
( [HTML](https://github.com/komasshu-skyway-sample/plugins/blob/master/examples/multiparty.html) )

## library

- [development version](https://raw.githubusercontent.com/komasshu-skyway-sample/plugins/master/multiparty/dist/multiparty.js)
- [minified version](https://raw.githubusercontent.com/komasshu-skyway-sample/plugins/master/multiparty/dist/multiparty.min.js)

## API reference

作成中・・・

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
