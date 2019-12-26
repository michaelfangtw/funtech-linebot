var linebot = require('linebot');
var express = require('express');

var bot = linebot({
  channelId: '1653670422',
  channelSecret: '2f17a0275f1f57e1d7037f57d529de37',
  channelAccessToken: 'DYMu02TejlJ1CAfkQ4mH8vmNXSato4azQvzyUA1DU8t8uWlnp2kxezvdZhIOh8Y6gb0x1gIkNz6FkcEWvT+VGAQZsUSbqzXTKvGQR0WavMRJolZ2jRLPELKFHLz1PNB4CWv/BWyAxj4dWKl4m0y84gdB04t89/1O/w1cDnyilFU='});


bot.on('message', function(event) {
  console.log(event); //把收到訊息的 event 印出來看看
});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});

