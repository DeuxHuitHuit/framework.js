
/**
 * Module dependencies.
 */

var 
    argv = require('optimist').argv
  , express = require('express')
  , path = require('path')
  , app = express(); // create the Express object
  

// dev only
app.configure('development', function _configureDev() {
	app.use(express.logger('dev'));
});

// configure for all targets
app.configure(function _configureAll() {
  console.log('Environnment: %s', app.get('env'));
	
  // app wide vars
  app.set('ip', process.env.IP || argv.ip || 'localhost');
  app.set('port', process.env.PORT || argv.port || 3000);

  app.use(express.static(__dirname));
  app.use(express.directory(__dirname));
  app.use(express.errorHandler());
});

// start the server
app.listen(app.get('port'), function _serverStarted() {
  console.log("Express server listening on " + app.get('ip') + " on port " + app.get('port'));
});