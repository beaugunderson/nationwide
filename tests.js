'use strict';

var async = require('async');
var fs = require('fs');
var spawn = require('child_process').spawn;
var Rhyme = require('rhyme-plus').Rhyme;
var sentenceTools = require('sentence-tools');
var _ = require('lodash');

var tests = [
  'Sit in the mud like a worm',
  'Were all the hot Ts go',
  'wish I could make it easy',
  'fake it until you make it.',
  'I can sing y\'all wanna hear?',
  'this house ain\'t got no ceilings',
  'I go out all hell breaks lose',
  'He my baby forever 😍🙌🏾',
  'Needs an Adam in her life 😭',
  'I wanna cry so badly',
  'The Real Housewives Of Twitter!!',
  'I miss all my followers',
  'Pink Floyd me da la vida 🌈',
  'This Sunday will be special :)',
  'Damn getting close to a year',
  'Happy National Day*ae*.',
  'I want the time you took back',
  'Emotional to the max',
  'A life sized teddy bear tho',
  'I\'m struggling with homework',
  'I want a motorcycle 😈',
  'And Claire is almost as bad.',
  'because I sure as hell am',
  '"You\'re too beautiful to cry."',
  'When ya money piling up',
  '“You cannot live without love.”',
  'Don\'t want to move from my bed 💤😴',
  'CHASING CARS JUST PLAYED. IM GONE.',
  'i need a christmas layout',
  'What I been trying to do 😴😴',
  'Bands after bands they add up',
  'Might have to hit this earl show.',
  'THEN SHE GOT REALLY GOOD PIECE.',
  'I\'m fucking irritated 😠😠😠😠😠😠😠',
  'THE BOARD GAME MADE THEM TIME GODS.',
  'Still not done with trig yet yikes',
  'I was thinking about you..',
  'Okay junior year you win',
  '“Life is a game, Play it!” - Kris',
  'Dude I need some more hangers',
  'She\'s just what Satan ordered.'
];

var rhyme = new Rhyme();

function template(notes) {
  return `<?xml version="1.0"?>
<!DOCTYPE SINGING PUBLIC "-//SINGING//DTD SINGING mark up//EN" "Singing.v0_1.dtd" []>
<SINGING BPM="60">
${notes}
</SINGING>`;
}

function wordsToNotes(words, syllables) {
  // var noteOrder = ['A3', 'C3', 'C3', 'C3', 'D3', 'F3', 'F3'];
  var noteOrder = ['A4', 'C4', 'C4', 'C4', 'D4', 'F4', 'F4'];
  var durationOrder = ['0.5', '0.3', '0.3', '0.3', '0.3', '0.3', '0.6'];

  var notes = [];

  syllables.forEach(function (count) {
    var note = _.times(count, function () {
      return noteOrder.shift();
    }).join(',');

    var duration = _.times(count, function () {
      return durationOrder.shift();
    }).join(',');

    var word = words.shift();

    notes.push(`<PITCH NOTE="${note}"><DURATION BEATS="${duration}">${word}</DURATION></PITCH>`);
  });

  return notes.join('\n');
}

function tts(xml, filename, cb) {
  console.log(`saving ${filename}...`);

  fs.writeFile(filename + '.xml', xml, 'utf8', function () {
    var t2w = spawn('./festival/build/festival/bin/text2wave', [
      '-mode', 'singing',
      '-eval', '(voice_kal_diphone)',
      '-o', filename,
      filename + '.xml'
    ]);

    t2w.stderr.pipe(process.stderr);
    t2w.stdout.pipe(process.stdout);

    t2w.on('close', function (code) {
      console.log(`wrote ${filename}: ${code}`);

      cb();
    });
  });
}

rhyme.load(function () {
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

  var i = 0;

  var path = '/home/www/beaugunderson.com/nationwide/';

  async.eachSeries(tests, function (test, cbEachSeries) {
    var words = sentenceTools.words(test);
    var s = syllables(test);
    var m = syllableMap(test);

    if (s === 7 &&
        (_.isEqual(m, [1, 1, 1, 1, 1, 1, 1]) ||
         _.isEqual(m, [1, 2, 1, 1, 1, 1]) ||
         _.isEqual(m, [1, 1, 2, 1, 1, 1]) ||
         _.isEqual(m, [1, 3, 1, 1, 1]) ||
         _.isEqual(m, [1, 1, 1, 1, 1, 2]) ||
         _.isEqual(m, [1, 2, 1, 1, 2]) ||
         _.isEqual(m, [1, 1, 2, 1, 2]) ||
         _.isEqual(m, [1, 3, 1, 2]))) {
      // console.log(m);
      // console.log(words);
      // console.log(template(wordsToNotes(words, m)));
      // console.log();

      var filename = path + ++i + '.wav';

      tts(template(wordsToNotes(words, m)), filename, cbEachSeries);
    } else {
      setImmediate(cbEachSeries);
    }
  }, function (err) {
    if (err) {
      throw err;
    }

    console.log('done');

    process.exit();
  });
});
