//
//  RTD2 - Twitter bot that tweets about the most popular github.com news
//  Also makes new friends and prunes its followings.
//
var sys = require('sys'),
    Watcher = require('rss-watcher'),
    htmlparser = require('htmlparser'),
    utils = require('./lib/utils'),
    Promises = require('./lib/promises');

var proximity = '100000';

// var feed = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom';
var feed = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom';

var watcher = new Watcher(feed);

var fetchFollowersAndSend = function(quakeData) {
  Promises.getQuakeBotFollowers('yourquakebot')
    .then(function(data) {
      Promises.lookupUsersByIds(data).then(function(users) {
        users.forEach(function(user) {
          utils.seeIfEarthquakeByUserAndSendDM(user, quakeData, proximity);
        });

      }, function(err) {
        console.log('error looking up quakebot users', err);
      });
    },
    function(err) {
      console.log(err);
    });
};

watcher.on('new article', function(quake){
  var quakeData = utils.extractDataFromQuake(quake);
  fetchFollowersAndSend(quakeData);
});

watcher.run(function(err, quakes) {
  if (err)
    console.error(err);
  if (quakes && quakes.length > 0) {
    smallQuakes = [quakes[0]];
    smallQuakes.map(utils.extractDataFromQuake).forEach(function(quakeData) {
      // fetchFollowersAndSend(quakeData);
    });
  }
});

