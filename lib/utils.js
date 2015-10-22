var Promises = require('./promises'),
    htmlparser = require('htmlparser'),
    geolib = require('geolib'),
    config = require('../config');

var utils = {};

var fetchedBounded = {};

// HTML Handler
var handler = new htmlparser.DefaultHandler(function (error, dom) {
  if (error)
    console.log('an error!', error);
});

var parser = new htmlparser.Parser(handler);

var regexp = /[\d]*\.[\d]*(?:&deg;)(N|S|W|E)/gi;

utils.extractLatLon = function(latLon) {
  var matches_array = latLon.match(regexp);
  var coordinates = matches_array.map(function(match) {
    var coordinate = match.split('&deg;');
    var direction = coordinate[1];
    switch(true) {
      case direction === 'N' || direction === 'E':
        return +coordinate[0];
      case direction === 'S' || direction === 'W':
        return -coordinate[0];
      default:
        return null;
    }
  });
  return { 'latitude': coordinates[0], 'longitude': coordinates[1]};
};

utils.extractDataFromQuake = function(quake) {
  var rawQuakeHTML = quake.summary;
  parser.parseComplete(rawQuakeHTML);
  dataObj = [];
  handler.dom.forEach(function(element) {
    if (element.name === 'dl'){
      var timeUTC = element.children[1].children[0].raw;

      var coordinate = utils.extractLatLon(element.children[4].children[0].raw);

      var depth = element.children[6].children[0].raw;
      dataObj = {
        'time':timeUTC,
        'coordinate': coordinate,
        'depth': depth,
        'title': quake.title
      };
    }
  });
  return dataObj;
};

utils.seeIfEarthquakeByUserAndSendDM = function(user, quakeData, proximity) {

  Promises.getUserCentreFromGoogle(user).then(function(userLocation) {
    var isInside = geolib.isPointInCircle(quakeData.coordinate, userLocation, proximity);
    if (isInside) {
      console.log('Tell em');
      Promises.postDM(user, 'Earthquake near you: ' + quakeData.title);
    }
  }, function(error) {
    console.log(error);
  });
};

module.exports = utils;
