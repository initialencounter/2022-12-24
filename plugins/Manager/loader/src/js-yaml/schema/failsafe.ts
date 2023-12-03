// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346


'use strict';


var Schema1 = require('../schema');


module.exports = new Schema1({
  explicit: [
    require('../type/str'),
    require('../type/seq'),
    require('../type/map')
  ]
});
