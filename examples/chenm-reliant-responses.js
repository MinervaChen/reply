//demonstrates subsequent questions that depend on initial question

var reply = require('./../');

var opts = {
  spirit_animal: {
    message: 'What is your spirit animal?',
    options: ['Husky', 'Couger', 'Centuar', 'Snake', 'Hummingbird']
  },
  husky_message: {
    message: 'You have the strength to rule the world! Will you do it?',
    depends_on: {
      spirit_animal: 'Husky'
    }
  },
  couger_message: {
    message: 'BOOO. No one wants you here! Type no to leave.',
    depends_on: {
      spirit_animal: 'Couger'
    }
  },
  lunch_suggestion: {
    message: 'OK. What do you feel like eating today?',
    options: ['Thai food','Mexican Food','Chinese Food','Pizza', 'Other'],
    depends_on: {
      spirit_animal: {not: 'Couger'}
    }
  },
  lunch_followup: {
    message: 'Sounds good to me! Wanna go?',
    depends_on: {
      spirit_animal: {not: 'Couger'},
      lunch_suggestion: 'Thai food'
    }
   },
  lunch_followup2: {
    message: 'Aww that\'s too bad. I was feeling like Thai food today',
    depends_on: {
      spirit_animal: {not: 'Couger'},
      lunch_suggestion: {not: 'Thai food'}
    }
   }
}

 reply.get(opts, function(err, result){})