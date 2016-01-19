//uses reply's confirm function to see if a player wants to exit a game

var reply = require('./../');

reply.confirm('Are you sure you want exit the game?', function(err, yes){
  if (!err && yes)
    console.log("Aww That's too bad. See you later!");
  else
    console.log("Cool. Let's keep going.");
});
