var linebot = require('linebot');
var express = require('express');
var http = require('http');
var https = require('https');
var fs = require("fs");
var cheerio=require('cheerio');//html parser

var bot = linebot({
channelId: '1653670422',
channelSecret: '2f17a0275f1f57e1d7037f57d529de37',
channelAccessToken: 'DYMu02TejlJ1CAfkQ4mH8vmNXSato4azQvzyUA1DU8t8uWlnp2kxezvdZhIOh8Y6gb0x1gIkNz6FkcEWvT+VGAQZsUSbqzXTKvGQR0WavMRJolZ2jRLPELKFHLz1PNB4CWv/BWyAxj4dWKl4m0y84gdB04t89/1O/w1cDnyilFU='}
);

  var timerPM;
  var timerUSD
  var pm = [];
  var usd;//美金
  var usdTime;
  _getPM25();
  _getUSD();
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
        var msg = event.message.text.toUpperCase();
        var replyMsg = '';               
        
        var regex = new RegExp('[0-9]*');
        var isNumber=regex.exec(msg);
        console.log('isNumber'+isNumber);
        if (isNumber){
                _getStock(msg).then((response)=>{
                    replyMsg=response; //取得
                    event.reply(replyMsg).then(function(data) {
                      console.log(replyMsg);
                    }).catch(function(error) {
                      console.log('error');
                    });      
                }).catch((error) => {
                    console.log(error);
                });

        }else{
                //非數字
                if (msg.indexOf('PM2.5') != -1) {
                  pm.forEach(function(e, i) {
                    if (msg.indexOf(e.SiteName) != -1) {
                      lineMsg=JSON.stringify(e);
                      replyMsg = e.SiteName + ' '+e.County+'的 PM2.5 數值為 ' +e['PM2.5']+'\r\n空氣品質:'+e.Status+ '\r\n更新時間:'+e.PublishTime;
                    }
                  });
                  if (replyMsg == '') {
                    replyMsg = '請輸入正確的地點';
                  }
                }

                if (msg.indexOf('美金') != -1) {          
                    replyMsg = '美金即期匯率:'+usd+ ' 更新時間:'+usdTime;
                }  
                if (replyMsg == '') {
                  replyMsg = '請輸入正確的地點';
                }
              
        
                if (replyMsg == '') {
                  replyMsg = '不知道「'+msg+'」是什麼意思 :p';
                }
          
                event.reply(replyMsg).then(function(data) {
                  console.log(replyMsg);
                }).catch(function(error) {
                  console.log('error');
                });      
        }//check number
      }//msg = text
    });//on.message  
  }//bot
  
  function _getPM25() {    
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
        var data = JSON.parse(body);       
        var count=0;
        var lastTime='';
        if (Array.isArray(data)){
            data.forEach(function(e, i) {
              count=i;
              //console.log('i='+i);
              pm[i] = [];
              // e.SiteName; //大里
              // e.County; //臺中市
              // e['PM2.5'] * 1; //18
              // e.Pollutant; //細懸浮微粒
              // e.PublishTime; //2019-12-26 22:00
              // e.Status; //Status
              pm[i]=e;
              lastTime=e.PublishTime;
            }); 
            console.log("PM2.5資料筆數:"+count);
            console.log("最後更新時間:"+lastTime);
        }        
        /*fs.writeFile('pm25.json', JSON.stringify(data),function(err){
                if (err)
                  console.log(err);
                else
                  console.log('writeFile complete.');
        });
        */
      });
      req.on('error', function(e) {
        console.error(e);
      });
    });

    
    clearTimeout(timerPM);    
    timerPM = setInterval(_getPM25, 1800*1000); //每半小時抓取一次新資料
  }

  
  function _getUSD() {    
    var url='https://rate.bot.com.tw/xrt?Lang=zh-TW';
    console.log(url); 
    var body='';
    var req = https.get(url,function(res) {      
      res.on('data', function (chunk) {
        body += chunk;
    });

      res.on('end', function(){
        //console.log(body);
          var $ = cheerio.load(body);
          var target = $(".rate-content-sight.text-right.print_hide");
          console.log(target[1].children[0].data);
          usd = target[1].children[0].data;
          
          var targetTime = $('.time');          
          console.log(targetTime[0].children[0].data);
          usdTime = targetTime[0].children[0].data;          
      });
      req.on('error', function(e) {
        console.error(e);
      });
    });

    
    clearTimeout(timerUSD);    
    timerUSD = setInterval(_getUSD, 1800*1000); //每半小時抓取一次新資料
  }

  function _getStock(stock) {
    return new Promise((resolve, reject) => {
          var url='https://tw.stock.yahoo.com/q/q?s='+stock;
          console.log(url); 
          var result="";
          var body='';
          var req = https.get(url,function(res) {      
            res.on('data', function (chunk) {
              body += chunk;
          });

            res.on('end', function(){        
              //console.log(body);
                index=3;  //第三欄        
                var $ = cheerio.load(body);
                var target = $("table table tr td b");
                console.log(target[0].children[0].data);     
                result= target[0].children[0].data;
                resolve(result);
            });
            req.on('error', function(e) {
              reject(error);
            });
          });
      });
  }
