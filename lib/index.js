const MultiParty = require("./MultiParty")

if(module.require) {
  module.exports = MultiParty;
} else {
  window.MultiParty = MultiParty;
}
