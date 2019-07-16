/*
 * -- AmrPlayer --
 * 
 *	copy by https://github.com/alex374/amr-player;
 * 
 *	After that, I revised it to make it better.
 * 
 * usage :
 * 
   <body>
	   <amr src="xx.amr" autoplay="autoplay"></amr>
	   <script src="amr-player-master/jquery-1.8.3.min.js" type="text/javascript" charset="utf-8"></script>
	   <script src="amr-player-master/amrnb.js" type="text/javascript" charset="utf-8"></script>
	   <script src="amr-player-master/amrplayer.js" type="text/javascript" charset="utf-8"></script>
   </body>
 * 
 * */
var AmrPlayer = function(amr_url, download_success_cb, download_progress_cb, play_end_cb, play_failed) {
	this.init(amr_url, download_success_cb, download_progress_cb, play_end_cb, play_failed);
};
AmrPlayer.prototype = {
	init: function(amr_url, download_success_cb, download_progress_cb, play_end_cb, play_failed) {
		this.audioContext = null;
		this.bufferSource = null;
		this.blob = null;
		this.curUrl = amr_url;
		this.canPlay = false;
		this.isPlaying = false;
		var cnt = 0;
		this.allTime = 0;
		this.ended_cb = function() {
			if(cnt === 0) {
				cnt++;
				console.info("AmrPlayer ended callback");
				play_end_cb && play_end_cb();
			}
		};
		this.downloadAmrBlob(amr_url, download_success_cb, download_progress_cb, play_failed);
	},
	downloadAmrBlob: function(amr_url, download_success_cb, download_progress_cb, play_failed) {
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', amr_url);
		xhr.responseType = 'blob';
		xhr.onreadystatechange = function(e) {
			if(xhr.readyState == 4 && xhr.status == 200) {
				self.blob = new Blob([xhr.response], {
					type: 'audio/mpeg'
				});
				self.genPLayer(function() {
					self.canPlay = true;
					download_success_cb && download_success_cb(self.allTime);
				}, function() {
					play_failed && play_failed();
				});
			}
			if(xhr.readyState == 4 && xhr.status == 404) {
				alert("amr address is wrong, please check amr address");
			}
		};
		xhr.onprogress = function(e) {
			if(e.lengthComputable) {
				download_progress_cb && download_progress_cb(e);
			}
		};
		xhr.send();
	},
	genPLayer: function(success_cb, failed_cb) {
		var self = this;
		this.isPlaying = false;
		this.readBlob(this.blob, function(data) {
			self.readAmrArray(data, success_cb, failed_cb);
		});
	},
	readBlob: function(blob, callback) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var data = new Uint8Array(e.target.result);
			callback(data);
		};
		reader.readAsArrayBuffer(blob);
	},
	readAmrArray: function(array, success_cb, failed_cb) {
		var samples = AMR.decode(array);
		if(!samples) {
			console.warn("current audio file read failed, url : " + this.curUrl);
			failed_cb && failed_cb();
			return;
		}
		this.readPcm(samples, success_cb);
	},
	readPcm: function(samples, success_cb) {
		var self = this;
		var ctx = this.getAudioContext();
		this.bufferSource = ctx.createBufferSource();
		var buffer = ctx.createBuffer(1, samples.length, 8000);
		if(buffer.copyToChannel) {
			buffer.copyToChannel(samples, 0, 0)
		} else {
			var channelBuffer = buffer.getChannelData(0);
			channelBuffer.set(samples);
		}
		this.bufferSource.buffer = buffer;
		this.bufferSource.connect(ctx.destination);
		this.bufferSource.onended = function() {
			self.ended_cb && self.ended_cb();
		};
		self.allTime = this.bufferSource.buffer.duration * 1000;
		success_cb && success_cb(self.allTime);
	},
	getAudioContext: function() {
		if(!this.audioContext) {
			if(window.AudioContext) {
				this.audioContext = new AudioContext();
			} else {
				this.audioContext = new window.webkitAudioContext();
			}
		}
		return this.audioContext;
	},
	play: function() {
		if(!this.isPlaying && this.canPlay && this.bufferSource) {
			this.bufferSource.start();
			this.isPlaying = true;
		} else {
			this.warn('can not play now');
		}
	},
	pause: function() {
		if(this.isPlaying && this.canPlay && this.bufferSource) {
			this.bufferSource.stop();
		}
	},
	toggle: function() {
		if(this.isPlaying) {
			this.pause()
		} else {
			this.play();
		}
	},
	endedWith: function(cb) {
		this.ended_cb = cb;
	},
	warn: function(msg) {
		console.warn(msg);
	}
};

//initAllAmr();

// init page
function initAllAmr() {
	$(function() {
		$("amr").each(function() {
			var that = $(this)
			setTimeout(function() {
				new amrEvent(that);
			}, 0)
		});
	});
};

var amrEvent = function(amrEle) {
	this.initAmrEvent(amrEle);
};
amrEvent.prototype = {
	initAmrEvent: function(amrEle) {
		this.ele = amrEle;
		this.src = "";
		this.autoplay = "";
		this.playBtn = "";
		this.downloadBtn = "";
		this.progressEle = "";
		this.timeSpan = "";
		this.position = 0;
		this.flag = true;
		this.changeProtocol = true;
		this.allTime = 0;
		this.delayTimer = "";
		this.isAmr = false;
		if(this.ele) {
			this.initData();
		}
	},
	initData: function() { // init amr data
		this.src = this.ele.attr("src") || "";
		this.autoplay = this.ele.attr("autoplay") || "";
		this.isAmr = this.isAmrFile();

		if(!this.src) {
			console.warm("current amr element 'src' no existed")
		} else {
			this.initAmr()
		}
	},
	initAmr: function() { // init amr element
		if(this.ele) {
			this.appendChild();
			this.initAmrTime();
			this.initClickEvent();
		}
	},
	initStyle: function() { // init amr element style
		amrCss = {
			"width": "320px",
			"height": "50px",
			"padding": " 0 10px",
			"border-radius": "25px",
			"background": "#f1f3f4",
			"display": "flex",
			"font-size": "14px",
			"align-items": "center",
			"justify-content": "flex-start"
		};
		this.ele.css(amrCss);
	},
	appendChild: function(special) { // append child in amr element
		var amrEle = this.ele,
			src = this.src,
			child = "";

		if(this.isAmr && !special) {
			this.initStyle();
			child = '<img name="playBtn" src="https://img.miliantech.com/public/images/playIcon/play_btn.png" width="30px" height="30px"/><span name="timeSpan" style="padding: 0 10px;">0:0:00/0:0:00</span><progress name="progress" value="0" max="100"></progress><img name="downloadBtn" width="22" height="22" src="https://img.miliantech.com/public/images/playIcon/download_btn.png" style="margin-left: 12px;"/>'
		} else {
			child = '<audio src="' + src + '" controls="controls"></audio>';
		}
		amrEle.empty().append(child);
		var playBtn = amrEle.find("img[name=playBtn]"),
			downloadBtn = amrEle.find("img[name=downloadBtn]"),
			progressEle = amrEle.find("progress[name=progress]"),
			timeSpan = amrEle.find("span[name=timeSpan]");

		this.playBtn = playBtn && playBtn.length > 0 ? playBtn : "";
		this.downloadBtn = downloadBtn && downloadBtn.length > 0 ? downloadBtn : "";
		this.progressEle = progressEle && progressEle.length > 0 ? progressEle : "";
		this.timeSpan = timeSpan && timeSpan.length > 0 ? timeSpan : "";
	},
	initAmrTime: function() { // init amr time
		var amrEle = this.ele,
			amrSrc = this.src;

		if(this.isAmr) {
			if(this.autoplay) {
				this.play();
			} else {
				this.showAmrTimes();
			};
		};
	},
	showAmrTimes: function() { // show amr time
		var self = this;
		this.initAmrPlayer(false, function(allTime, currentTime) {
			self.setTimeSpan(allTime, currentTime);
		});
	},
	initClickEvent: function() { // init click event
		var self = this,
			amrEle = this.ele,
			src = amrEle.attr("src");

		if(!self.isAmr || !amrEle) {
			return false;
		}
		self.playBtn && self.playBtn.on("click", function(e) {
			self.play();
		})
		self.downloadBtn && self.downloadBtn.on("click", function(e) {
			self.downloadFile();
		})
	},
	changeAmrStyle: function(status_cb) { // change amr children style
		var self = this;
		if(!this.isAmrEle()) {
			return;
		};
		if(self.isAmr) {
			self.setPlayBtnIcon(false);
			self.initAmrPlayer(true, function(allTime, currentTime) {
				self.setTimeSpan(allTime, currentTime);
				self.setProgressStatus(allTime, currentTime);
				if(currentTime >= allTime) {
					self.setPlayBtnIcon(true);
				}
			}, status_cb)
		} else {
			alert("amr address is wrong, please check amr address");
		}
	},
	initAmrPlayer: function(isPlay, time_cb, status_cb) { // init amr player
		var self = this;
		status_cb && status_cb(true)
		this.player = new AmrPlayer(self.changeAmrSrc(), function(allTime) { // play start callBack
			self.allTime = allTime;
			time_cb && time_cb(self.allTime, self.position);
			if(isPlay) {
				self.player.pause();
				self.player.play();
				self.playTimer = setInterval(function() {
					self.position += 100;
					time_cb && time_cb(self.allTime, self.position);
				}, 100);
				self.startDelayTimer(self.allTime);
				self.flag = false;
			}
		}, function() { // download progress callBack
		}, function() { // play end callBack
			if(isPlay) {
				status_cb && status_cb(false)
				self.playEnd();
				time_cb && time_cb(self.allTime, self.position);
			}
		}, function() { // play error, AMR.decode(array) is null
			self.isSpecialAudio()
		});
	},
	playEnd: function() { // play end
		this.flag = true;
		clearInterval(this.playTimer);
		clearTimeout(this.delayTimer);
		this.delayTimer = "";
		this.player && this.player.pause();
		this.position = 0;
		this.setPlayBtnIcon(true);
	},
	changeAmrSrc: function() {
		var amrSrc = this.src,
			newSrc = ""

		if(this.changeProtocol) { // fix url start protocol, can search 'this.changeProtocol' change content
			if(location.protocol == "http:" && amrSrc.indexOf("https://") >= 0) {
				newSrc = "http://" + amrSrc.slice(8, amrSrc.length);
			} else if(location.protocol == "https:" && amrSrc.indexOf("http://") >= 0) {
				newSrc = "https://" + amrSrc.slice(7, amrSrc.length);
			} else {
				newSrc = amrSrc;
			}
			// set `src` in dom
			//			this.ele.attr("src", newSrc);
			return newSrc
		} else {
			return amrSrc
		}
	},
	downloadFile: function() { // download the file
		var self = this

		if(this.isAmr) {
			window.open(self.src);
		} else {
			alert("amr address is wrong, please check amr address");
		};
	},
	play: function(status_cb) { // amr player autoplay
		var self = this,
			amrEle = self.ele

		if(self.playBtn) {
			if(self.flag) {
				self.changeAmrStyle(status_cb);
			} else {
				if(self.player) {
					self.player.toggle();
				}
				self.flag = true;
			};
		} else {
			console.warn("don't have the play button, play img button must has ( name='playBtn' ) this property");
		};
	},
	isAmrEle: function() { // is amr element
		var ele = this.ele
		return ele.prop("tagName").toLocaleLowerCase() == "amr" && ele.length > 0;
	},
	isAmrFile: function() { // is amr file
		var amrSrc = this.src
		return amrSrc != "" && amrSrc != undefined && amrSrc.indexOf(".amr") > 0 && amrSrc.substr(amrSrc.length - 4).toLowerCase() == ".amr";
	},
	setTimeSpan: function(allTime, currentTime) { // set time
		if(this.timeSpan) {
			var time = this.toSecond(currentTime) + "/" + this.toSecond(allTime);
			this.timeSpan.html(time);
		};
	},
	setPlayBtnIcon: function(isOver) { // set play btn icon
		var playBtn = this.playBtn
		if(playBtn.length > 0) {
			var src = isOver ? "https://img.miliantech.com/public/images/playIcon/play_btn.png" : "https://img.miliantech.com/public/images/playIcon/stop_btn.png";
			playBtn.attr("src", src);
		};
	},
	setProgressStatus: function(allTime, currentTime) { // set progress status
		var progress = this.progressEle
		if(progress) {
			var value = progress.attr("max") / allTime * currentTime;
			progress.attr("value", !isNaN(value) ? value : 0);
		};
	},
	toSecond: function(second) { // millSecond to second
		var date = new Date(second);
		var hours = date.getHours() - 8;
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		var time = (hours > 0 ? hours + ":" : "0:") + (minutes > 0 ? minutes + ":" : "0:") + (seconds > 0 ? (seconds >= 10 ? seconds : "0" + seconds) : "00");
		return time;
	},
	isSpecialAudio: function() { // if play error, will create audio element
		if(this.isAmrEle()) {
			$(this.ele).css({
				"background": "transparent",
				"padding": 0
			})
			this.appendChild(true)
		}
	},
	startDelayTimer: function(allTime) { // stop playing after playing all the time
		var self = this;
		self.delayTimer = setTimeout(function() {
			self.playEnd();
		}, allTime ? allTime : 100);
	}
};