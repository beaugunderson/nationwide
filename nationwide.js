'use strict';

// var async = require('async');
var botUtilities = require('bot-utilities');
var Rhyme = require('rhyme-plus').Rhyme;
var sentenceTools = require('sentence-tools');
var Twit = require('twit');
var _ = require('lodash');

_.mixin(botUtilities.lodashMixins);

var program = require('commander');

program
  .command('tweet')
  .description('')
  .option('-r, --random', 'only post a percentage of the time')
  .action(botUtilities.randomCommand(function () {
    var T = new Twit(botUtilities.getTwitterAuthFromEnv());

    var rhyme = new Rhyme();

    function syllables(line) {
      return _.sum(sentenceTools.words(line).map(function (word) {
        return rhyme.syllables(word) || 1000;
      }));
    }

    function syllableMap(line) {
      return sentenceTools.words(line).map(function (word) {
        return rhyme.syllables(word);
      });
    }

    rhyme.load(function () {
      var stream = T.stream('statuses/sample', {language: 'en'});

      stream.on('tweet', function (tweet) {
        var s = syllables(tweet.text);
        var m = syllableMap(tweet.text);

        if (s === 7 &&
            (_.isEqual(m, [1, 1, 1, 1, 1, 1, 1]) ||
             _.isEqual(m, [1, 2, 1, 1, 1, 1]) ||
             _.isEqual(m, [1, 1, 2, 1, 1, 1]) ||
             _.isEqual(m, [1, 3, 1, 1, 1]) ||
             _.isEqual(m, [1, 1, 1, 1, 1, 2]) ||
             _.isEqual(m, [1, 2, 1, 1, 2]) ||
             _.isEqual(m, [1, 1, 2, 1, 2]) ||
             _.isEqual(m, [1, 3, 1, 2]))) {
          console.log(s, '-', tweet.text);
        }
      });
    });
  }));

program.parse(process.argv);
