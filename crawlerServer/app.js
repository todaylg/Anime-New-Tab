var http = require("http"),
  fs = require('fs'),
  url = require("url"),
  superagent = require("superagent"),
  cheerio = require("cheerio"),
  async = require("async"),
  eventproxy = require('eventproxy');

var ep = new eventproxy();

var catchFirstUrl = 'https://anime-pictures.net',  //入口页面
  deleteRepeat = {},  //去重哈希数组
  urlsArray = [], //存放爬取网址
  ImgArr = [], //存放爬取数据
  pageUrls = [],  //存放收集文章页面网站
  pageNum = 100
  
  ,  //要爬取文章的页数
  startDate = new Date(), //开始时间
  endDate = false;  //结束时间

for (var i = 0; i <= pageNum; i++) {
  pageUrls.push('https://anime-pictures.net/pictures/view_posts/' + i + '?res_x=1920&res_y=1080&res_x_n=1&res_y_n=1&aspect=16%3A9&order_by=rating&ldate=0&lang=en');
}

// console.log(http);
// 主start程序
function start() {
  function onRequest(req, res) {
    // 设置字符编码(去掉中文会乱码)
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    // 当所有 'ImageHtml' 事件完成后的回调触发下面事件
    ep.after('ImageHtml', pageUrls.length * 80, function (articleUrls) {//一页有80张图
      //取得页面中的图片链接了
      // 获取 ImageHtml 页面内所有图片文章链接
      // for(var i = 0 ; i < articleUrls.length ; i++){
      //   res.write(articleUrls[i] +'<br/>');  
      // }    
      console.log('articleUrls.length is' + articleUrls.length + ',content is :' + articleUrls.length);

      //控制并发数
      var curCount = 0;
      var reptileMove = function (url, callback) {
        //延迟毫秒数
        var delay = parseInt((Math.random() * 100000000) % 1000, 10);
        curCount++;
        console.log('现在的并发数是', curCount, '，正在抓取的是', url, '，间隔' + delay + '毫秒');
        superagent.get(url)
          .end(function (err, sres) {
            // 常规的错误处理
            if (err) {
              console.log(err);
              return;
            }

            //sres.text 里面存储着请求返回的 html 内容
            if (sres) {
              var $ = cheerio.load(sres.text);
              //收集数据
              var res = $('#big_preview_cont>a').attr('href');
              ImgArr.push(res);
            }
          });
        setTimeout(function () {
          curCount--;
          callback(null, url + 'Call back content');
        }, delay * 2);
      };


      async.mapLimit(articleUrls, 10, function (url, callback) {
        reptileMove(url, callback);
      }, function (err, result) {
        fs.writeFile('./wallPaper/imageData.json', JSON.stringify(ImgArr), 'utf-8', function (err) {
          console.log('Over!!!');
        });
      });
    });
    // 轮询 所有文章列表页
    // pageUrls.forEach(function(pageUrl){

    //控制并发数
    var curCountForPage = 0;
    function getPage(pageUrl, callback) {
      //延迟毫秒数
      var delay = parseInt((Math.random() * 100000000) % 1000, 10);
      curCountForPage++;
      console.log('现在的并发数是', curCountForPage, '，正在抓取的是', pageUrl, '，间隔' + delay + '毫秒');
      superagent.get(pageUrl)
        .end(function (err, pres) {
          // console.log('fetch ' + pageUrl + ' successful');
          res.write('fetch ' + pageUrl + ' successful<br/>');
          // 常规的错误处理
          if (err) {
            console.log(err);
          }
          // pres.text 里面存储着请求返回的 html 内容，将它传给 cheerio.load 之后
          // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
          // 剩下就都是 jquery 的内容了
          if (pres) {
            var $ = cheerio.load(pres.text);
            var curPageUrls = $('.img_block_big>a');
            for (var i = 0; i < curPageUrls.length; i++) {
              var articleUrl = catchFirstUrl + curPageUrls.eq(i).attr('href');
              urlsArray.push(articleUrl);
              // 相当于一个计数器
              ep.emit('ImageHtml', articleUrl);
            }
          }
        })
      setTimeout(function () {
        curCountForPage--;
        callback(null, url + 'Call back content');
      }, delay * 2);
    }

    async.mapLimit(pageUrls, 10, function (url, callback) {
      getPage(url, callback);
    }, function (err, result) {
      res.write('Page--OK!');
    });
  }
  http.createServer(onRequest).listen(3000);//浏览器访问localhost:3000即开始爬取

}

start()