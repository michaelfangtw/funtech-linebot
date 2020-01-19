var linebot = require('linebot');
var express = require('express');
var http = require('http');
var https = require('https');
var fs = require("fs");
var cheerio=require('cheerio');//html parser
var dateFormat = require('dateformat');

  var bot = linebot({
    channelId: process.env.ChannelId,
    channelSecret: process.env.ChannelSecret,
    channelAccessToken: process.env.ChannelAccessToken}
  );
  
  
  //console.log('process.env.ChannelId='+process.env.ChannelId);
  //console.log('process.env.ChannelSecret='+process.env.ChannelSecret);
  //console.log('process.env.ChannelAccessToken='+process.env.ChannelAccessToken);
  
  var timerPM;
  var timerUSD;
  var timerCheckLargeVolume;
  var pm = [];
  var usd;//美金
  var usdTime;
  const adminUserId='U773bb1c2a78a60a0a72e21c19c67befc';

  
  
  const app = express();
  const linebotParser = bot.parser();
  app.post('/', linebotParser);
  
  //因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
  var server = app.listen(process.env.PORT || 8080, function() {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
  runBot();    
  updatePM25PerHour();
  updateUSDPerHour();
  
  const stockID="0056";
  const minVolume=20000;
  const intervalInSec=600;
  let lastStockTime="";
    //getStockByID(stockID);
  checkLargeVolume(stockID,adminUserId,minVolume,intervalInSec); //every 10 mins check 

  function runBot() {
    bot.on('message', function(event) {
      let userId=event.source.userId;
      if (event.message.type == 'text') {
        var msg = event.message.text.toUpperCase();
        var replyMsg = '';                       
        var isNumber=msg.match("[0-9]{4,6}");
        console.log('isNumber='+isNumber);
        if (isNumber){
                getStockByID(msg).then((stock)=>{
                    replyMsg=formatStock(stock); //取得
                    sendMessage(event,replyMsg);                
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
                      sendMessage(event,replyMsg);                
                    }
                  });
                  if (replyMsg == '') {
                    replyMsg = '請輸入正確的地點';
                    sendMessage(event,replyMsg);                
                  }
                }

                if ((msg.indexOf('美金') != -1)||(msg.indexOf('美元') != -1)) {          
                    replyMsg = '美金即期匯率:'+usd+ ' 更新時間:'+usdTime;
                    sendMessage(event,replyMsg);      
                }

                cmdList='您可以使用的指令如下:\r\n';
                cmdList+='股價查詢:e.g 0050\r\n';
                cmdList+='美金匯率:e.g 我要查美金匯率\r\n';
                cmdList+='PM2.5:e.g 板橋的PM2.5\r\n';
            
                // if (userId==adminUserId){
                //     replyMsg ='您目前身分為是管理者!\r\n';                    
                //     replyMsg+=cmdList;
                // }else{
                //     replyMsg= '您目前身分為是一般使用者!';                
                //     replyMsg+=cmdList;
                // }     
                sendMessage(event,replyMsg);   
                
        }//check number
      }//msg = text
    });//on.message  
  }//bot
  
  //傳送訊息的函式
function sendMessage(event,message){
  /*
  message = {
    "type": "sticker",
    "packageId": "1",
    "stickerId": "1"
  };  

  message = {
    "type": "image",
    "originalContentUrl": "圖片網址",
    "previewImageUrl": "縮圖網址"
  }
 */
  event.reply(message).then(function(data) {
     // success 
     console.log('message='+message);
     console.log('data='+data);
     return true;
  }).catch(function(error) {
     // error 
     console.log('error='+error);
     return false;
  });
}



  function updatePM25PerHour() {    
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
            console.log('PM2.5資料筆數:'+count+ ' 更新時間:'+lastTime);
        }        
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

    
    clearTimeout(timerPM);    
    timerPM = setInterval(updatePM25PerHour, 3600*1000); //每小時抓取一次新資料
  }

  
  function updateUSDPerHour() {    
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
          usd = target[1].children[0].data;          
          var targetTime = $('.time');                    
          usdTime = targetTime[0].children[0].data;          
          console.log('USD:'+usd+',更新時間:'+usdTime);
      });
      req.on('error', function(e) {
        console.error(e);
      });
    });

    
    clearTimeout(timerUSD);    
    timerUSD = setInterval(updateUSDPerHour, 3600*1000); //每小時抓取一次新資料
  }
  
  function getStockByID(stockId) {
    return new Promise((resolve, reject) => {
          var url='https://ww2.money-link.com.tw/TWStock/StockChart.aspx?SymId='+stockId;
          console.log(url); 
          var result="";
          var body='';
          var req = https.get(url,function(res) {      
            res.on('data', function (chunk) {
              body += chunk;
          });

            res.on('end', function(){     
                try
                {
                      var $ = cheerio.load(body);                
                      console.log("============================");
                      var stock=new Stock();
                      stock.id=stockId;
                      var stockTag = $(".TwstockID h3");                                     
                      var stockName=stockTag[0].children[0].data;
                      stock.name=stockName;                                            

                      var priceTag = $(".TwstockID h1");                
                      var price=priceTag[0].children[0].data;
                      stock.price=price;                      

                      var changeTag = $(".TwstockID div");     
                      var change=changeTag[0].children[0].data;
                      var changeArray=change.split("(");   
                      change=changeArray[0];
                      stock.change=change;

                      var changePercent=changeArray[1].replace(")","");
                      stock.changePercent=changePercent;

                      var volumeTag = $(".TwstockMainBox .R");   
                      //console.log(volumeTag[2].children[3].children[0].data);
                      var volume=volumeTag[2].children[3].children[0].data.replace(",","");
                      //console.log('volume='+volume);
                      stock.volume=volume;

                      var timeTag = $(".TwstockMainBox .R .day");
                      console.log(timeTag[0].children[0].data);
                      var time=timeTag[0].children[0].data;  
                      stock.time=time;                      
                      resolve(stock);
                }catch(err){                                   
                    result="查無股票代號:" +stockId;
                    console.log('getStock,error='+err);
                    console.log(result);
                    resolve(result);
                }
            });
            req.on('error', function(e) {
              reject(error);
            });
          });
      });
  }

  function formatStock(stock){
    var result="";
    console.log(stock);
    result=stock.id+' '+stock.name+'\r\n股價:'+stock.price+'\r\n漲跌:'+stock.change+' '+stock.changePercent+'\r\n成交量:' + stock.volume;
                      result+="\r\n資料更新時間:"+stock.time;                      
    return result;
  }

 
  //定期偵測0056成交量  
  async function checkLargeVolume(stockId,userId,minVolume,intervalInSec){
       let stock=await getStockByID(stockId);
       let stockTime=stock.time.substring(0,10);
       let now=new Date(new Date().toUTCString());
       var systemTime=dateFormat(now, "yyyy-mm-dd HH:MM:ss"); 
       //console.log(stock);              
       console.log("====checkLargeVolume start===");        
       console.log("userId="+userId);      
       console.log("stockId="+stock.id);
       console.log("volume="+stock.volume);    
       console.log("minVolume="+minVolume);    
       console.log("lastStockTime="+lastStockTime);
       console.log("stockTime="+stockTime);  
       console.log("systemTime="+systemTime);
        if (stock.volume>minVolume&&(lastStockTime!=stockTime)){          
          var sendMsg = "★★★ "+stock.id+" "+stock.name+",成交量:" + stock.volume+"《超過"+minVolume+"》\r\n";
            sendMsg+= "價格:"+stock.price+" " +stock.change + " "+stock.changePercent+"\r\n";
            sendMsg+= "股價時間:"+stock.time+"\r\n";
            sendMsg+= "系統時間:"+systemTime
          console.log("sendMsg="+sendMsg);
          bot.push(userId, sendMsg); 
          console.log("push to userId="+userId);
          lastStockTime=stockTime;     
        }        
        console.log("====checkLargeVolume end===");       
        clearTimeout(timerCheckLargeVolume);    
        timerCheckLargeVolume = setInterval(checkLargeVolume, intervalInSec*1000); //每10分抓取一次新資料

        timerCheckLargeVolume=setInterval( ()=>{ 
          checkLargeVolume(stockId,userId,minVolume,intervalInSec); 
        }, intervalInSec*1000);
  }

  class Stock {
    constructor() {      
    }
    set id(id){
      this._id=id;
    }
    get id(){
      return this._id;
    }
    
    set name(name) {
      this._name = name;
    }
    get name() {
      return this._name;
    } 
    set price(price)  {
      this._price=price;
    }
    get price(){
      return this._price;
    }
    set volume(volume){
      this._volume=volume;
    }
    get volume(){
      return this._volume;
    }

    set change(change){
      this._change=change;
    }
    get change(){
      return this._change;
    }        

    set changePercent(changePercent){
      this._changePercent=changePercent;
    }

    get changePercent(){
      return this._changePercent;
    }
    set time(time){
      this._time=time;
    }
    get time(){
      return this._time;
    }
  }