# Multi Party

[日本語](./README.md) | [English](./README.en.md)

This is a library for easy implementation of group video chat with SkyWay(http://nttcom.github.io/skyway/).

## Sample

```javascript
// Generate a MultiParty instance.
multiparty = new MultiParty( {
  "key": "********-****-****-****-************"  /* SkyWay key */,
  "reliable": true /* Use reliable communication(SCTP) in Data Channel. */
});

// for MediaStream
//

multiparty.on('my_ms', function(video) {
  // Show my video.
  var vNode = MultiParty.util.createVideoNode(video);
  vNode.volume = 0;
  $(vNode).appendTo("#streams");
}).on('peer_ms', function(video) {
  // Show peer's video.
  var vNode = MultiParty.util.createVideoNode(video);
  $(vNode).appendTo("#streams");
}).on('ms_close', function(peer_id) {
  // Remove the video node when peer is disconnected.
  $("#"+peer_id).remove();
})


// for DataChannel
//

$("button").on('click', function(ev) {
  multiparty.send('hello'); /* Send message to the connected peers. */
});

multiparty.on('message', function(mesg) {
  $("p.receive").append(mesg.data + "<br>"); /* Show the received message.  */
});

// Connect to the server and peers
multiparty.start()
```

## Demo Page

* [https://nttcom.github.io/SkyWay-MultiParty/examples/multiparty-sample.html](https://nttcom.github.io/SkyWay-MultiParty/examples/multiparty-sample.html)
( [HTML](https://github.com/nttcom/SkyWay-MultiParty/blob/master/examples/multiparty-sample.html) )

## Download

* [development version](https://skyway.io/dist/multiparty.js)
* [minified version](https://skyway.io/dist/multiparty.min.js)

## API reference

### MultiParty

```javascript
var multiparty = new MultiParty([options]);
```


- options
    * key (string)
        * an API key obtained from [SkyWay Web Site](https://skyway.io/ds/)
    * room (string)
        * room name
    *  id (string)
        * user id
    * reliable (boolean)
        * **true** indicates reliable data transfer (data channel). ```default : false```
    * selialization (string)
        * set data selialization mode ( binary | binary-utf8 | json | none ). ```default : binary```
    * video (boolean)
        * **true** indicates video streaming is enabled.```default: true```
    * audio (boolean)
        * **true** indicates audio streaming is enabled. ```default: true```
    * polling (boolean)
        * **true** indicates check user list via server polling. ```default: true```
    * polling_interval (number)
        * polling interval in msec order. ```default: 3000```
    * debug (number)
        * debug log level appeared in console.

    ```
    0 Prints no logs.
    1 Prints only errors.
    2 Prints errors and warnings.
    3 Prints all logs.
    ```
    * host (string)
        * peer server host name.
    * port (number)
        * peer server port number.
    * secure (boolean)
        * true means peer server provide tls.
    * config (object)
        * passed to RTCPeerConnection. it indicates custom ICE server configuration. Defaults to ```{ 'iceServers': [{ 'url': 'stun:stun.skyway.io:3478' }] }```.



### start

Connect to the SkyWay server and all peers.


### multiparty.on


```javascript
multiparty.on(event, callback);
```

#### 'open'
```javascript
multiparty.on('open', function(myid){ ... });
```
* Emitted when a connection to SkyWay server has established.
* **id** : id of current window.

#### 'my_ms'
```javascript
multiparty.on('my_ms', function({"src": <object url>, "id": <myid>}){...});
```
* Emitted when this window's video/audio stream has setuped. **object url** is the url for captured stream. **id** is current window's id.
* **object url** : url for captured stream.
* **id** : current window's id.

#### 'peer_ms'
```javascript
multiparty.on('peer_ms', function({"src": <object url>, "id": <peer-id>, "reconnect": <true or false>}){ ... });
```
* Emitted when peer's av stream has setuped.
* **src** : Object URL of peer's stream.
* **id** : peer's id.
* **reconnect** :  **true** when connected via reconnect method.

#### 'peer_ss'
```javascript
multiparty.on('peer_ss', function({"src": <object url>, "id": <peer-id>, "reconnect": <true or false>}){ ... });
```
* Emitted when peer's screen captrure stream has setuped.
* **src** : Object URL of peer's screen capture stream.
* **id** :  peer's id.
* **reconnect** : **true** when connected via reconnect method.

#### 'ms_close'
```javascript
multiparty.on('ms_close', function(peer-id){ ... });
```
* Emitted when peer's media stream has closed.
* **peer-id** : peer's id.

#### 'ss_close'
```javascript
multiparty.on('ss_close', function(peer-id){ ... });
```
* Emitted when peer's screen cast stream has closed.
* **peer-id** : peer's id.

#### 'dc_open'
```javascript
multiparty.on('dc_open', function(peer-id){ ... });
```
* Emitted when the connection for data channel with peer is setuped.
* **peer-id** : peer's id.

#### 'message'
```javascript
multiparty.on('message', function({"id": <peer-id>, "data": <data>}){ ... });
```
* Emitted when receive message from peer.
* **peer-id** : peer's id.
* **data** : Received data.

#### 'dc_close'
```javascript
multiparty.on('dc_close', function(peer-id){ ... });
```
* Emitted when data connection has closed with peer.
* **peer-id** : peer's id.

#### 'error'
```javascript
multiparty.on('error', function(error){ ... });
```
* Emitted when an error occurs.
* **error** : Error object.

### mute

Mute current video/audio.

```javascript
multiparty.mute({"video": <true of false>, "audio": <true or false>);
```


### unmute

Unmute current video/audio.

```javascript
multiparty.unmute({"video": <true of false>, "audio": <true or false>);
```


### removePeer

Close peer's media stream and data stream.

```javascript
multiparty.removePeer(peer-id);
```

### send

Send data to every peer.

```javascript
multiparty.send(data);
```


### close

Close every connection.

```javascript
multiparty.close();
```

### startScreenShare

Start screen share.

```javascript
multiparty.startScreenShare(function(stream){
  // success callback
}, function(err) {
  // error callback
});
```

### stopScreenShare

Stop screen share.

```javascript
multiparty.stopScreenShare();
```

### listAllPeers

Get all of the connected peer ids.

```javascript
multiparty.listAllPeers(function(lists) { ... });
```

### reconnect

Reconnect the disconnected peer.

```javascript
multiparty.reconnect(peer_id, function({"video": <boolean>, "screen": <boolean>, "data": <boolean>}){ ... });
```

### MultiParty.util.createVideoNode

Create video node from Object URL.

```javascript
var vNode = MultiParty.util.createVideoNode({"src": object_url, "id": peer_id}){ ... });
```


## LICENSE & Copyright

[LICENSE](https://github.com/nttcom/SkyWay-MultiParty/blob/master/LICENSE)
