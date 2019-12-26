var linebot = require('linebot');
var express = require('express');
var http = require('http');
var fs = require("fs");

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
              lineMsg=JSON.stringify(e);
              replyMsg = e[0] + '的 PM2.5 數值為 ' + lineMsg;
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
    var url='http://opendata.epa.gov.tw/api/v1/AQI?%24skip=0&%24top=1000&%24format=json';
    console.log(url); 
   var body='';
    var req = http.get(url,function(res) {
      //console.log("statusCode: ", res.statusCode);
      //console.log("headers: ", res.headers);
    
      res.on('data', function (chunk) {
        body += chunk;
    });

      res.on('end', function(){
        // 將 JSON parse 成物件
        //console.log("==response.body ==============================================");
        //console.log(body);
        //console.log("==response.body ==============================================");
        var data = JSON.parse(body);
        //console.log('data=')
        //console.log(data); // 可開啟這行在 Command Line 觀看 data 內容
        if (Array.isArray(data)){
            data.forEach(function(e, i) {
              console.log('i='+i);
              pm[i] = [];
              pm[i][0] = e.SiteName; //大里
              pm[i][1] = e.County; //臺中市
              pm[i][2] = e['PM2.5'] * 1; //18
              pm[i][3] = e.Pollutant* 1; //細懸浮微粒
              pm[i][4] = e.PublishTime; //2019-12-26 22:00
              pm[i][5] = e.Status; //Status

              console.log('=============');
              console.log(e);
              console.log('=============');
            });           
        }
        //fs.writeFile( 'save.json', JSON.stringify( data ), 'utf8');
        fs.writeFile('pm25.json', JSON.stringify(data),function(err){
                if (err)
                  console.log(err);
                else
                  console.log('writeFile complete.');
        });
      });
      req.on('error', function(e) {
        console.error(e);
      });
    });

    
    clearTimeout(timer);    
    timer = setInterval(_getJSON, 1800000); //每半小時抓取一次新資料
  }

