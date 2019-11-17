var catchFirstUrl = 'https://anime-pictures.net',
	//bing_link = 'http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
	// bing_link = 'https://bing.ioliu.cn/v1/rand';
	bing_link = 'https://uploadbeta.com/api/pictures/random/?key=BingEverydayWallpaperPicture';
var currentImg;
function Init() {
	let preloadEle = document.querySelector('#loadingPage');
	preloadEle.width = window.innerWidth;
	preloadEle.height = window.innerHeight;
	chrome.storage.local.get("preLoadAnime", function (val) {
		if (val.preLoadAnime) {
			new LGPreLoading(preloadEle);
		}
	})
	if (navigator.onLine) {
		chrome.storage.local.get("bossComming", function (val) {
			if (val.bossComming == undefined || val.bossComming == false) {
				chrome.storage.local.get("imageDataJson", function (val) {
					if (val.imageDataJson == undefined) {
						$.getJSON("./../backgrounds/imageData.json", function (data) {
							chrome.storage.local.set({ "imageDataJson": data });
						});
						$("#loading").remove();
						$("#loadingPage").fadeOut(2000, function () {
							$(this).remove();
						});
					} else {
						var data = val.imageDataJson;
						getRandomImg(data);
					}
				});
			} else {
				//家长模式
				//随机风景
				var tempImage = new Image();
				tempImage.src = bing_link;
				tempImage.onload = function () {
					$("#background").css('backgroundImage', 'url(' + bing_link + ')');
					$('#loadingPage').fadeOut(2000);
				};
				//固定当日必应首页壁纸
				// $.ajax({
				// 	url: bing_link,
				// 	type: 'GET',
				// 	dataType: 'json',
				// 	success: function (json) {
				// 		var url = "http://www.bing.com" + json.images[0].url;
				// 		var tempImage = new Image();
				// 		tempImage.src = url;
				// 		tempImage.onload = function () {
				// 			$("#background").css('backgroundImage', 'url(' + url + ')');
				// 			$('#loadingPage').fadeOut(2000);
				// 		};
				// 	}
				// });
			}
		});
	} else {//离线的情况
		$("#loading").remove();
		$("#loadingPage").fadeOut(2000, function () {
			$(this).remove();
		});
	}
	getTime();
	initEvent();
	getWeatherInfo();
	loadTasks();
	Translate();
	getBangumi();
	initLive2D();
}

function initLive2D() {
	loadlive2d("live2d", "/assets/kesshouban_v2/model.json");
}
function getRandomImg(data) {
	var randomNum = Math.random();
	//提高在前面的概率
	if (randomNum > 0.1) randomNum = randomNum * Math.random();
	if (randomNum > 0.3) randomNum = randomNum * Math.random();
	var index = parseInt(randomNum * data.length, 10);
	if (data[index] != null) {
		currentImg = catchFirstUrl + data[index];
		var tempImage = new Image();
		tempImage.src = currentImg;
		tempImage.onload = fin;

		var finFlag = false;
		setTimeout(function () {
			if (!finFlag) fin();
		}, 2500);

		function fin() {
			if (finFlag) return;
			finFlag = true;
			$("#background").css('backgroundImage', 'url(' + catchFirstUrl + data[index] + ')');
			$('#loadingPage').fadeOut(2000);
		}
	} else {
		getRandomImg(data);
	}
}

function getTime() {
	Date.prototype.Format = function (fmt) {
		var o = { //key为正则匹配的内容  value为替换内容
			"M+": this.getMonth() + 1, //月份 0代表1月
			"d+": this.getDate(), //日
			"h+": this.getHours(), //小时
			"m+": this.getMinutes(), //分
			"s+": this.getSeconds() //秒
		};
		if (/(y+)/.test(fmt)) //y 用来表示年，+匹配前面一个表达式1次或者多次
			fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); //替换年份  str.substr(start[, length])
		for (var k in o) //替换其他位置
			if (new RegExp("(" + k + ")").test(fmt))
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); //只传一个（比如yyyy-M-d）,直接替换。substr()的巧妙使用解决了多个（一般是两个，就比如下面的使用例子）时的情况（在前面添加00是为了在0个匹配的情况的显示00）。
		return fmt;
	};
	var weekday = [];
	weekday[0] = "周日";
	weekday[1] = "周一";
	weekday[2] = "周二";
	weekday[3] = "周三";
	weekday[4] = "周四";
	weekday[5] = "周五";
	weekday[6] = "周六";

	var date = $("#date");
	var time = $("#time");

	var updateClock = function () {
		var myDate = new Date();
		var week = weekday[myDate.getDay()];
		date.text(myDate.Format("yyyy年MM月dd日") + ' ' + week);
		time.text(myDate.Format("hh:mm"));
	};
	updateClock();
	setInterval(updateClock, 10000);
}

function initEvent() {
	//Search  Todo:setting=>google
	$("#searchInput").keydown(function (event) {
		if (event.which === 13) {
			if ($('#searchInput').val() != '') {
				//search
				var searchUrl = 'https://www.baidu.com/s?wd=' + $('#searchInput').val();
				location.href = searchUrl;
			}
		}
	});

	$('#download').click(function (event) {
		if (currentImg != null) {
			chrome.downloads.download({
				url: currentImg,
				conflictAction: 'uniquify',
				saveAs: false
			});
		}
	});
	$('#preLoadToggle').click(function (event) {
		chrome.storage.local.get("preLoadAnime", function (val) {
			if (val.preLoadAnime == undefined) {
				chrome.storage.local.set({ "preLoadAnime": true });
			} else {
				chrome.storage.local.set({ "preLoadAnime": !Boolean(val.preLoadAnime) });
			}
		});
		location.reload();
	});

	$('#todo').click(function (event) {
		//TodoList open/close
		$('#panel').toggle(500);
	});

	//todoList
	$('#todoNew').keydown(function (event) {
		if (event.keyCode == 13) {
			var obj = $(this);
			addTask(obj.val());
			obj.val('');
		}
	});

	$('#todoList').on('change', '.todo-item-checkbox', function (event) {
		saveTasks();
	});

	$('#todoList').click(function (event) {
		if (event.target.className == 'deleteItem') {
			var container = $(event.target).parent('.todo-item');
			deleteTask(container);
		}
	});

	//Translate
	$("#translateTitle").click(function (event) {
		//TODO 动画效果
		$("#translatePanel").toggle();
	});

	//changeColor
	$("#fontColor").click(function (event) {
		//ChangeColor
		if ($('body').css('color') == "rgb(255, 255, 255)") {
			$('body').css('color', 'black');
			$('#searchInput').css({
				color: 'black',
				borderBottom: '3px solid black'
			});;
			$('#bottom-right span').css('color', 'black');
			$('#bottom-left span').css('color', 'black');
			$('#fontColor').css('color', 'white');
		} else {
			$('body').css('color', 'white');
			$('#searchInput').css({
				color: 'white',
				borderBottom: '3px solid white'
			});;
			$('#bottom-right span').css('color', 'white');
			$('#bottom-left span').css('color', 'white');
			$('#fontColor').css('color', 'black');
		}
	});

	chrome.storage.local.get("hideClock", function (val) {
		if (!val.hideClock) {
			$('#center').css({ opacity: 1 });
			$('#center-below').css({ opacity: 1 });
		} else {
			$('#center').css({ opacity: 0 });
			$('#center-below').css({ opacity: 0 });
		}
	})
	//hidePanel
	$("#hideSpan").click(function () {
		if ($('#center').is(":animated") || $('#center-below').is(":animated")) {
			return;
		}
		chrome.storage.local.get("hideClock", function (val) {
			if (!val.hideClock) {
				$('#center').animate({ opacity: 0 }, 500);
				$('#center-below').animate({ opacity: 0 }, 500);
				chrome.storage.local.set({ "hideClock": true });
			} else {
				$('#center').animate({ opacity: 1 }, 500);
				$('#center-below').animate({ opacity: 1 }, 500);
				chrome.storage.local.set({ "hideClock": false });
			}
			chrome.storage.local.get("hideClock", function (val) {
			console.log(val);
			})
		});
	});

	//Animation
	$('.tab_container').click(function (event) {
		if ($(event.target).attr("data-weekday") != undefined && $(event.target).attr("data-insert") == 'no') {
			var weekday = $(event.target).attr("data-weekday");
			readBugumiData(weekday);
		}
	});
	$('#live2d').click(function (event) {
		$('.send').animate({
			opacity: 0,
			top: -20
		},
			1000, function () {
				$('.send').remove()
			});
		if ($('#Animation').is(":animated")) {
			return;
		} else {
			if ($("#Animation").css('display') == 'none') {
				//open
				$("#Animation").css('display', 'block');
				$("#Animation").animate({
					opacity: 1,
					marginTop: 0
				},
					800);
			} else {
				//close
				$("#Animation").animate({
					opacity: 0,
					marginTop: '-100%'
				},
					600, function () {
						$("#Animation").css('display', 'none');
					});
			}
		}
	});

	//Boss comming
	$('#changeTheme').click(function (event) {
		chrome.storage.local.get("bossComming", function (val) {
			if (val.bossComming == undefined) {
				chrome.storage.local.set({ "bossComming": true });
			} else {
				chrome.storage.local.set({ "bossComming": !Boolean(val.bossComming) });
			}
		});
		location.reload();
	});
}

function getCityWeather(province, city) {
	var url = 'http://wthrcdn.etouch.cn/weather_mini?city=' + city;
	var updateWeather = function (weatherData) {
		$('#city').text(weatherData.city);
		$('#temperature').text(weatherData.temperature);
		$('#aqi').text(weatherData.aqi);
	};
	$.getJSON(url, function (json, textStatus) {
		var data = {
			city: province + " " + city,
			temperature: json.data ? json.data.wendu : '',
			tips: json.data ? json.data.ganmao : '',
			aqi: json.data ? json.data.aqi : ''
			// forecast:json.data.forecast //Todo
		};
		updateWeather(data);
	});
}
function getWeatherInfo() {
	chrome.storage.local.get("cityInfo", function (val) {
		if (val.cityInfo == undefined) {
			$.getJSON('http://ip.360.cn/IPShare/info', function (json) {
				var ip = json.ip;
				$.getJSON('http://ip.taobao.com/service/getIpInfo.php?ip=' + ip, function (json) {
					chrome.storage.local.set({
						"cityInfo": {
							city: json.data.city,
							province: json.data.region
						}
					});
					getCityWeather(json.data.region, json.data.city);
				})
			})
		} else {
			getCityWeather(val.cityInfo.province, val.cityInfo.city);
		}

	})
}

function loadTasks() {
	var todoCount = 0;
	chrome.storage.local.get("todoList", function (val) {
		if (val.todoList != undefined) {
			$.each(val.todoList, function (index, el) {
				var html = '<li class="todo-item">';
				html += '<input class="todo-item-checkbox" type="checkbox" ' + (el.isCompleted ? "checked" : "") + '>';
				html += '<span class="todo-item-content">' + el.content + '</span>';
				html += '<i class="deleteItem">x</i></li>';
				$('#todoList').append(html);
			});
			todoCount = val.todoList.length;
		} else {
			todoCount = 0;
		}

		$('#todoCount').text(todoCount + '  Todo');
	});
}

function saveTasks() {
	var taskList = $('#todoList').children('li');
	var res = [];
	var todoCount = taskList.length;
	taskList.each(function (index, el) {
		var item = $(el);
		var isCompleted = false;
		if ($(item.children('.todo-item-checkbox')).is(':checked')) {
			isCompleted = true;
			todoCount--;
		}
		var content = $.trim(item.children('.todo-item-content').text());
		res.push({
			isCompleted: isCompleted,
			content: content
		});
	});
	chrome.storage.local.set({ "todoList": res });
	$('#todoCount').text(todoCount + '  Todo');
}

function deleteTask(taskContainer) {
	$(taskContainer).fadeOut('400', function () {
		$(taskContainer).remove();
		saveTasks();
	});
}

function addTask(taskContent) {
	taskContent = $.trim(taskContent);
	if (taskContent) {
		var html = '<li class="todo-item">';
		html += '<input class="todo-item-checkbox" type="checkbox">'
		html += '<span class="todo-item-content">' + taskContent + '</span>';
		html += '<i class="deleteItem">x</i></li>';
		$('#todoList').append(html);
		saveTasks();
	}
}

/**
*
* @param fn {Function}   实际要执行的函数
* @param delay {Number}  延迟时间，也就是阈值，单位是毫秒（ms）
*
* @return {Function}     返回防抖函数
*/
function debounce(fn, delay) {

	// 定时器，用来 setTimeout
	var timer

	// 返回一个函数，这个函数会在一个时间区间结束后的 delay 毫秒时执行 fn 函数
	return function () {

		// 保存函数调用时的上下文和参数，传递给 fn
		var context = this
		var args = arguments

		// 每次这个返回的函数被调用，就清除定时器，以保证不执行 fn
		clearTimeout(timer)

		// 当返回的函数被最后一次调用后（也就是用户停止了某个连续的操作），
		// 再过 delay 毫秒就执行 fn
		timer = setTimeout(function () {
			fn.apply(context, args)
		}, delay)
	}
}

//translate function learn from moonrailgun: https://github.com/moonrailgun
function Translate() {
	var gloGtk = '';
	var gloToken = '';
	var langdetect = function (query, cb) {
		$.ajax({
			url: 'https://fanyi.baidu.com/langdetect',
			type: 'POST',
			dataType: 'json',
			data: { query: query },
			success: function (json) {
				cb(json);
			}
		})
	}
	var getSign = function (query, gtk) {
		var C = gtk;
		function a(r, o) {
			for (var t = 0; t < o.length - 2; t += 3) {
				var a = o.charAt(t + 2);
				a = a >= "a" ? a.charCodeAt(0) - 87 : Number(a), a = "+" === o.charAt(t + 1) ? r >>> a : r << a, r = "+" === o.charAt(t) ? r + a & 4294967295 : r ^ a
			}
			return r
		}
		function n(r) {
			var o = r.length;
			o > 30 && (r = "" + r.substr(0, 10) + r.substr(Math.floor(o / 2) - 5, 10) + r.substr(-10, 10));
			var t = void 0,
				n = "" + String.fromCharCode(103) + String.fromCharCode(116) + String.fromCharCode(107);
			t = null !== C ? C : (C = window[n] || "") || "";
			for (var e = t.split("."), h = Number(e[0]) || 0, i = Number(e[1]) || 0, d = [], f = 0, g = 0; g < r.length; g++) {
				var m = r.charCodeAt(g);
				128 > m ? d[f++] = m : (2048 > m ? d[f++] = m >> 6 | 192 : (55296 === (64512 & m) && g + 1 < r.length && 56320 === (64512 & r.charCodeAt(g + 1)) ? (m = 65536 + ((1023 & m) << 10) + (1023 & r.charCodeAt(++g)), d[f++] = m >> 18 | 240, d[f++] = m >> 12 & 63 | 128) : d[f++] = m >> 12 | 224, d[f++] = m >> 6 & 63 | 128), d[f++] = 63 & m | 128)
			}
			for (var S = h, u = "" + String.fromCharCode(43) + String.fromCharCode(45) + String.fromCharCode(97) + ("" + String.fromCharCode(94) + String.fromCharCode(43) + String.fromCharCode(54)), l = "" + String.fromCharCode(43) + String.fromCharCode(45) + String.fromCharCode(51) + ("" + String.fromCharCode(94) + String.fromCharCode(43) + String.fromCharCode(98)) + ("" + String.fromCharCode(43) + String.fromCharCode(45) + String.fromCharCode(102)), s = 0; s < d.length; s++)
				S += d[s], S = a(S, u);
			return S = a(S, l), S ^= i, 0 > S && (S = (2147483647 & S) + 2147483648), S %= 1e6, S.toString() + "." + (S ^ h)
		}
		return n(query);
	}
	var fetchToken = function () {
		$.get('https://fanyi.baidu.com/', function (data) {
			var gtk = data.match(/window\.gtk\s=\s'(.*?)'/);
			gtk = gtk[1];
			var token = data.match(/\stoken:\s'(.*?)'/);
			token = token[1];
			chrome.storage.local.set({
				"translate": {
					gtk: gtk,
					token: token,
					updateAt: new Date().getTime()
				}
			});
			gloGtk = gtk;
			gloToken = token;
			//console.log('获取百度翻译配置', 'token:', token, 'gtk:', gtk);
		})
	}
	var transapiAjax;
	$('#translateInput').bind("keyup change", debounce(function (event) {
		var query = $('#translateInput').val();
		query = $.trim(query);
		if (query != "") {
			langdetect(query, function (json) {
				var lan = json.lan;
				var from = lan;
				var to;
				if (from == "en") {
					to = "zh";
				} else if (from == "zh") {
					to = "en";
				} else {
					to = "zh";
				}
				var sign = getSign(query, gloGtk);
				if (transapiAjax != null) transapiAjax.abort();
				transapiAjax = $.ajax({
					url: 'https://fanyi.baidu.com/v2transapi',
					type: 'POST',
					dataType: 'json',
					data: {
						from: from,
						to: to,
						transtype: 'realtime',
						simple_means_flag: 3,
						query: query,
						sign: sign,
						token: gloToken
					},
					success: function (data) {
						if (data.error && data.error === 998) {
							// token 过期， 重新请求token
							fetchToken();
							return;
						}

						var transResult = data.trans_result.data;
						var result = $('#translateResult');
						result.text('');
						var restr = '';
						$.each(transResult, function (index, el) {
							restr += el.dst + ';';
						});
						result.text(restr);
					}
				})
			});
		} else {
			$('#translateResult').text('');
		}
	}, 200))

	chrome.storage.local.get("translate", function (val) {
		if (!val.translate || new Date().getTime() - val.translate.updateAt > 1000 * 60 * 60 * 10) {
			fetchToken();
		} else {
			gloGtk = val.translate.gtk;
			gloToken = val.translate.token;
		}
	})
}

function getBangumi() {
	//保存当天日期，判断是第二天了再重新发起请求更新数据来源
	//取得数据后按更新时间分组，并显示当天更新的番剧列表
	var day = new Date;
	day = day.getDay();
	chrome.storage.local.get("today", function (val) {
		if (val.today != undefined) {
			var today = val.today;
			if (today != day) {
				getData();
			} else {
				//初始化当天
				readBugumiData(day);
			}
		} else {
			chrome.storage.local.set({ "today": day });
			getData();
		}
	});
	var getData = function () {
		$.ajax({
			url: 'http://bangumi.bilibili.com/jsonp/timeline_v2.ver?callback=timeline',
			type: 'get',
			dataType: 'text',
			success: function (data) {
				//remove:timeline(
				data = data.slice(9, data.length - 2);
				data = JSON.parse(data);
				var list = data.list;
				var weekday = [];
				for (var j = -1; j < 7; j++) {
					weekday[j] = [];
				}
				for (var i = 0; i < list.length; i++) {
					var temp = {
						cover: list[i].cover,
						bgmcount: list[i].bgmcount,
						favorites: list[i].favorites,
						lastupdate_at: list[i].lastupdate_at,
						play_count: list[i].play_count,
						title: list[i].title,
						season_id: list[i].season_id,
						//url: 'http://www.bilibili.com' + list[i].url,//20180313链接改为了http://bangumi.bilibili.com/anime/season_id的形式
						weekday: list[i].weekday
					};
					weekday[temp.weekday].push(temp);
				}
				//save
				chrome.storage.local.set({ "weekday": weekday }, function () {
					readBugumiData(day);
				});
			},
			error: function (e) {
				console.log(e);
			}
		});
	};
}

function readBugumiData(day) {
	chrome.storage.local.get("weekday", function (val) {
		$('#tab' + day).attr('checked', 'true');
		$('#tab' + day).attr('data-insert', 'yes');
		var list = $('#content' + day + ' .bangumiList');
		if (val.weekday[day] != undefined) {
			$.each(val.weekday[day], function (index, el) {
				var html = '<li class="bangumiItem"><div class="bangumiContain">';
				var animeUrl = 'http://bangumi.bilibili.com/anime/' + el.season_id;
				html += '<a target="_blank" class="bangumiPreview" href="' + animeUrl + '">';
				html += '<img src="' + el.cover + '" alt="' + el.title + '"></a>';
				html += '<div class="bangumIntro">';
				html += '<a href="' + animeUrl + '" target="_blank" title="' + el.title + '">';
				html += '<p><span class="animeTitle">' + el.title + '</span></p></a>';
				html += '<p>最近更新：</p>';
				if (el.lastupdate_at) {
					html += '<p class="update-time">' + new Date(el.lastupdate_at).Format("MM月dd日hh:mm") + '</p>';
				} else {
					html += '<p class="update-time">不知道呢</p>';
				}
				if (el.bgmcount == '-1') {
					html += '<p class="update-info"><span></span>没出呢还</p>';
				} else if (!(el.bgmcount >= 0)) {
					html += '<p class="update-info"><span></span>' + el.bgmcount + '</p>';
				} else {
					html += '<p class="update-info"><span></span>第' + el.bgmcount + '话</p>';
				}
				html += '<p class="favorite"><span>追番：' + el.favorites + '</span>';
				html += '<p class="point"><span>点击：' + el.play_count + '</span></p></div></div></li>';
				list.append(html);
			});
		}
	});
}

Init();