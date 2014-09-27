/**
 *
 * add features to transform sdp, so that we can change
 * media format (G.711 => Opus, vp8 => H.264)
 *
 * base iedea is broughted by (not marged yet)
 * https://github.com/peers/peerjs/blob/84fe0ee2d92d8e6d1a9926efcd1873f1b7cce324/lib/negotiator.js
 */

Negotiator._makeOffer = function(connection) {
  var pc = connection.pc;
  pc.createOffer(function(offer) {
    util.log('Created offer.');

    if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
      offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }

    if (connection.options.sdpTransform && typeof connection.options.sdpTransform === 'function') {
      // to enable conditional branch, includes connection object.
      offer.sdp = connection.sdpTransform(connection, offer.sdp) || offer.sdp;
    }

    pc.setLocalDescription(offer, function() {
      util.log('Set localDescription: offer', 'for:', connection.peer);
      connection.provider.socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
        type: connection.type,
        label: connection.label,
        connectionId: connection.id,
        reliable: connection.reliable,
        serialization: connection.serialization,
        metadata: connection.metadata,
        browser: util.browser
        },
        dst: connection.peer
      });
    }, function(err) {
      connection.provider.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emit('error', err);
    util.log('Failed to createOffer, ', err);
  }, connection.options.constraints);
}

