var twilio = require('twilio'),
    client = twilio('ACCOUNTSID', 'AUTHTOKEN'),
    cronJob = require('cron').CronJob;

var giphy = require('giphy-wrapper')('YOUR_API_KEY');
 
var express = require('express'),
    bodyParser = require('body-parser'),
    app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
 
var Firebase = require('firebase'),
    usersRef = new Firebase('{FIREBASEURL}/Users/');
 
var numbers = [];
 
usersRef.on('child_added', function(snapshot) {
  numbers.push( snapshot.val() );
  console.log( 'Added number ' + snapshot.val() );
});
 
var textJob = new cronJob( '0 18 * * *', function(){
  giphy.search('puppy', 100, 0, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }

    var gifs = data.data;
    var gif = gifs[Math.floor(Math.random()*gifs.length)];
    for( var i = 0; i < numbers.length; i++ ) {
      client.sendMessage( { to:numbers[i], from:'YOURTWILIONUMBER', body:'PUPPIES!', mediaUrl: gif.images.downsized.url}, function( err, data ) {
        console.log( data.body );
      });
    }
  });  
},  null, true);
 
app.post('/message', function (req, res) {
  var resp = new twilio.TwimlResponse();
  if( req.body.Body.trim().toLowerCase() === 'subscribe' ) {
    var fromNum = req.body.From;
    if(numbers.indexOf(fromNum) !== -1) {
      resp.message('You already subscribed!');
    } else {
      resp.message(function() {
        this.body('Thank you, you are now subscribed. Reply "STOP" to stop receiving updates.')
            .media('http://media.giphy.com/media/zl170rmVMCpEY/giphy.gif');
      });
      usersRef.push(fromNum);
    }
  } else {
    resp.message('Welcome to Daily Updates. Text "Subscribe" receive updates.');
  }
  res.writeHead(200, {
    'Content-Type':'text/xml'
  });
  res.end(resp.toString());
});
 
var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
