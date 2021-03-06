//This is the reply module, created to be a simple way of getting user input in Node.js 
//By Thomas Pollak, available on github: https://github.com/tomas/reply

// requires 'readline': allows reading of a stream on a line-by-line basis
var rl, readline = require('readline');

/**
 * represents a readline interface with an input and output stream
 * @param {string} stdin
 * @param {string} stdout
 * @returns {readline} readline object
 */
var get_interface = function(stdin, stdout) {
  if (!rl) rl = readline.createInterface(stdin, stdout);
  else stdin.resume(); // interface exists
  return rl;
}

/**
 * Confirms a question by prompting the user to confirm message
 * @param {string} message - confirmation message
 * @param {function} callback - function to be activated after method is completed
 */
var confirm = exports.confirm = function(message, callback) {
  //initializes question object
  var question = {
    'reply': {
      type: 'confirm',
      message: message,
      default: 'yes'
    }
  }
  //processes question to prompt 
  get(question, function(err, answer) {
    if (err) return callback(err);
    callback(null, answer.reply === true || answer.reply == 'yes');
  });

};

/**
 * Gets and processes questions, replies and answers to error check and deliver appropriate responses
 * @param {object} options - options & questions with options
 * @param {function} callback - function to be activated after event has been completed
 */
var get = exports.get = function(options, callback) {
  if (!callback) return; // no point in continuing
  
  if (typeof options != 'object')
    return callback(new Error("Please pass a valid options object."))

  var answers = {},
      stdin = process.stdin,
      stdout = process.stdout,
      fields = Object.keys(options);
  
  //closes prompt
  var done = function() {
    close_prompt();
    callback(null, answers);
  }
  
  //closes readline prompt
  var close_prompt = function() {
    stdin.pause();
    if (!rl) return;
    rl.close();
    rl = null;
  }
  
  //gets default options
  var get_default = function(key, partial_answers) {
    if (typeof options[key] == 'object')
      return typeof options[key].default == 'function' ? options[key].default(partial_answers) : options[key].default;
    else
      return options[key];
  }
  
  //returns true/false based on expected reply matches
  var guess_type = function(reply) {
    if (reply.trim() == '')
      return;
    else if (reply.match(/^(true|y(es)?)$/))
      return true;
    else if (reply.match(/^(false|n(o)?)$/))
      return false;
    else if ((reply*1).toString() === reply)
      return reply*1;

    return reply;
  }
  
  //validates responses
  var validate = function(key, answer) {
    if (typeof answer == 'undefined')
      return options[key].allow_empty || typeof get_default(key) != 'undefined';
    else if(regex = options[key].regex)
      return regex.test(answer);
    else if(options[key].options)
      return options[key].options.indexOf(answer) != -1;
    else if(options[key].type == 'confirm')
      return typeof(answer) == 'boolean'; // answer was given so it should be
    else if(options[key].type && options[key].type != 'password')
      return typeof(answer) == options[key].type;
    return true;
  }

  //displays user error and displays valid response types
  var show_error = function(key) {
    var str = options[key].error ? options[key].error : 'Invalid value.';
    if (options[key].options)
        str += ' (options are ' + options[key].options.join(', ') + ')';
        stdout.write('\033[31m' + str + '\033[0m' + '\n');
  }

  //displays question message given key
  var show_message = function(key) {
    var msg = '';
    if (text = options[key].message)
      msg += text.trim() + ' ';
    if (options[key].options)
      msg += '(options are ' + options[key].options.join(', ') + ')';
    if (msg != '') stdout.write("\033[1m" + msg + "\033[0m\n");
  }

  /**
  * waits for user input for responses
    if required, '*' are used for appropriate input characters shown to users
    if crtl+c is used, prompt is shut down and appropriate error is given
  * @param {string} prompt - prompt
  * @param {function} callback - callback function
  * @returns {function} callback - callback function
  */
  var wait_for_password = function(prompt, callback) {

    var buf = '',
        mask = '*';

    var keypress_callback = function(c, key) {

      if (key && (key.name == 'enter' || key.name == 'return')) {
        stdout.write("\n");
        stdin.removeAllListeners('keypress');
        // stdin.setRawMode(false);
        return callback(buf);
      }

      if (key && key.ctrl && key.name == 'c')
        close_prompt();

      if (key && key.name == 'backspace') {
        buf = buf.substr(0, buf.length-1);
        var masked = '';
        for (i = 0; i < buf.length; i++) { masked += mask; }
        stdout.write('\r\033[2K' + prompt + masked);
      } else {
        stdout.write(mask);
        buf += c;
      }

    };

    stdin.on('keypress', keypress_callback);
  }
  
  /**
  * checks reply by checking answer type and validating response; outputs error if appropriate
  * @param {int} index - reply index
  * @param {string} current key - current response key
  * @param {string} fallback - fallback response
  * @param {string} reply - user reply text
  */
  var check_reply = function(index, curr_key, fallback, reply) {
    var answer = guess_type(reply);
    var return_answer = (typeof answer != 'undefined') ? answer : fallback;

    if (validate(curr_key, answer))
      next_question(++index, curr_key, return_answer);
    else
      show_error(curr_key) || next_question(index); // repeats current
  }
  
  /**
  * returns true if dependencies are met
  * @param {object} conditions - conditions to be met
  * @returns {boolean} - true if dependencies are met
  */
  var dependencies_met = function(conds) {
    for (var key in conds) {
      var cond = conds[key];
      if (cond.not) { // object, inverse
        if (answers[key] === cond.not)
          return false;
      } else if (cond.in) { // array 
        if (cond.in.indexOf(answers[key]) == -1) 
          return false;
      } else {
        if (answers[key] !== cond)
          return false; 
      }
    }

    return true;
  }

  /**
  * proceeed with next question
  * @param {int} index - index of question
  * @param {string} prev_key - key of previous question
  * @param {string} answer - user response
  * @returns {function} next_question if applicable
  */
  var next_question = function(index, prev_key, answer) {
    if (prev_key) answers[prev_key] = answer;
    var curr_key = fields[index];
    if (!curr_key) return done();
    
    //only prompt question if dependency is met
    if (options[curr_key].depends_on) {
      if (!dependencies_met(options[curr_key].depends_on))
        return next_question(++index, curr_key, undefined);
    }

    var prompt = (options[curr_key].type == 'confirm') ?
      ' - yes/no: ' : " - " + curr_key + ": ";

    var fallback = get_default(curr_key, answers);
    if (typeof(fallback) != 'undefined' && fallback !== '')
      prompt += "[" + fallback + "] ";

    show_message(curr_key);

    if (options[curr_key].type == 'password') {

      var listener = stdin._events.keypress; // to reassign down later
      stdin.removeAllListeners('keypress');

      // stdin.setRawMode(true);
      stdout.write(prompt);

      wait_for_password(prompt, function(reply) {
        stdin._events.keypress = listener; // reassign
        check_reply(index, curr_key, fallback, reply)
      });

    } else {

      rl.question(prompt, function(reply) {
        check_reply(index, curr_key, fallback, reply);
      });
    }
  }

  rl = get_interface(stdin, stdout);
  next_question(0);

  //closes prompt and displays number of responses given before closing
  rl.on('close', function() {
    close_prompt(); // just in case
    var given_answers = Object.keys(answers).length;
    if (fields.length == given_answers) return;
    var err = new Error("Cancelled after giving " + given_answers + " answers.");
    callback(err, answers);
  });

}
