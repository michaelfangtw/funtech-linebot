var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');


var bot = linebot({
  channelId: '1653670422',
  channelSecret: '2f17a0275f1f57e1d7037f57d529de37',
  channelAccessToken: 'DYMu02TejlJ1CAfkQ4mH8vmNXSato4azQvzyUA1DU8t8uWlnp2kxezvdZhIOh8Y6gb0x1gIkNz6FkcEWvT+VGAQZsUSbqzXTKvGQR0WavMRJolZ2jRLPELKFHLz1PNB4CWv/BWyAxj4dWKl4m0y84gdB04t89/1O/w1cDnyilFU='}
  );

  var timer;
  var pm = [];
  _getJSON();
  
  _bot();
  const app = express();
  const linebotParser = bot.parser();
  app.post('/', linebotParser);
  
  //因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
  var server = app.listen(process.env.PORT || 8080, function() {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
  
  function _bot() {
    bot.on('message', function(event) {
      if (event.message.type == 'text') {
        var msg = event.message.text;
        var replyMsg = '';
        if (msg.indexOf('PM2.5') != -1) {
          pm.forEach(function(e, i) {
            if (msg.indexOf(e[0]) != -1) {
              replyMsg = e[0] + '的 PM2.5 數值為 ' + e[1];
            }
          });
          if (replyMsg == '') {
            replyMsg = '請輸入正確的地點';
          }
        }
        if (replyMsg == '') {
          replyMsg = '不知道「'+msg+'」是什麼意思 :p';
        }
  
        event.reply(replyMsg).then(function(data) {
          console.log(replyMsg);
        }).catch(function(error) {
          console.log('error');
        });
      }
    });
  
  }
  
  function _getJSON() {
    clearTimeout(timer);
    getJSON('http://opendata2.epa.gov.tw/AQX.json', function(error, response) {
      response.forEach(function(e, i) {
        pm[i] = [];
        pm[i][0] = e.SiteName;
        pm[i][1] = e['PM2.5'] * 1;
        pm[i][2] = e.PM10 * 1;
      });
    });
    timer = setInterval(_getJSON, 1800000); //每半小時抓取一次新資料
  }

