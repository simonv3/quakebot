var Promise = require('es6-promise').Promise,
    Twit = require('Twit'),
    config = require('./../config'),
    request = require('request');

var Promises = {};

var T = new Twit(config.twitter);
var makingARequest = 0;

extractLocationFromTwitterUser = function(user) {
  // This is pretty rough, but can be refined in the future.
  // return 'California';
  var bestLocation = user.time_zone;

  if (user.location !== '') {
    bestLocation = user.location;
  }

  return bestLocation;
};

// Twitter API Promise Wrappers

Promises.postDM = function(user, text) {
  return new Promise(function(resolve, reject) {
    T.post('direct_messages/new', {user_id: user.id, text:text}, function(err, data, response) {
      if (err)
        reject(err);
      else if (data.errors)
        reject(data.errors);
      else {
        resolve(data);
      }
    });
  });
};

Promises.getUserCentreFromGoogle = function(user) {
  return new Promise(function(resolve, reject) {
    var userLocation = extractLocationFromTwitterUser(user);

    if (userLocation !== null) {
      var url = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + config.google.api_key + '&address=' + userLocation;

      request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var results = JSON.parse(body).results;
          if (results !== undefined) {
            resolve(results[0].geometry.location);
          }
          reject(error);
        }
      });
    } else {
      reject('No Location');
    }
  });
};

Promises.getUserBoundingBox = function(user) {
  return new Promise(function(resolve, reject) {

    makingARequest ++;
    T.get('geo/search', { query: extractLocationFromTwitterUser(user), grandularity: 'city' }, function(err, data, response) {
      if (err)
        reject(err);
      else if (data.errors) {
        reject(data.errors);
      } else {
        var boundingBox = data.result.places[0].bounding_box;
        converted = boundingBox.coordinates[0].map(function(coord) {
          return {
            'latitude': coord[1],
            'longitude': coord[0]
          };
        });
        resolve(converted);
      }
    });
  });
};

Promises.getQuakeBotFollowers = function(screenName) {
  return new Promise(function (resolve, reject) {

    makingARequest ++;
    console.log('makingARequest get quakebot followers', makingARequest);
    T.get('followers/ids', { screen_name: screenName }, function(err, data, response) {
      if (err)
        reject(err);
      if (data.errors)
        reject(data.errors);
      resolve(data);
    });
  });
};

Promises.lookupUsersByIds = function(data) {
  return new Promise( function (resolve, reject) {
    makingARequest ++;
    console.log('makingARequest look up users by ids', makingARequest);
    T.get('users/lookup', { user_id:  data.ids.join(',') }, function(err, data, response) {
      if (err)
        reject(err);
      if (data.errors)
        reject(data.errors);
      resolve(data);
    });
  });
};

module.exports = Promises;
