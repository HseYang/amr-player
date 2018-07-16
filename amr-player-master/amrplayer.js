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
	   <amr src="http://xxxx.amr"></amr>
	   <script src="amr-player-master/jquery-1.8.3.min.js" type="text/javascript" charset="utf-8"></script>
	   <script src="amr-player-master/amrnb.js" type="text/javascript" charset="utf-8"></script>
	   <script src="amr-player-master/amrplayer.js" type="text/javascript" charset="utf-8"></script>
   </body>
 * 
 * */
var AmrPlayer = function(amr_url, download_success_cb, download_progress_cb, play_end_cb) {
	this.init(amr_url, download_success_cb, download_progress_cb, play_end_cb);
};
AmrPlayer.prototype = {
	init: function(amr_url, download_success_cb, download_progress_cb, play_end_cb) {
		this.audioContext = null;
		this.bufferSource = null;
		this.blob = null;
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
		this.downloadAmrBlob(amr_url, download_success_cb, download_progress_cb);
	},
	downloadAmrBlob: function(amr_url, download_success_cb, download_progress_cb) {
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', amr_url);
		xhr.responseType = 'blob';
		xhr.onreadystatechange = function(e) {
			if(xhr.readyState == 4 && xhr.status == 200) {
				self.blob = new Blob([xhr.response], {
					type: 'audio/mpeg'
				});
				self.canPlay = true;
				self.genPLayer(function() {
					download_success_cb && download_success_cb(self.allTime);
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
	genPLayer: function(success_cb) {
		var self = this;
		this.isPlaying = false;
		this.readBlob(this.blob, function(data) {
			self.readAmrArray(data, success_cb);
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
	readAmrArray: function(array, success_cb) {
		var samples = AMR.decode(array);
		if(!samples) {
			alert('Failed to decode!');
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
		if(!this.isPlaying && this.canPlay) {
			this.bufferSource.start();
			this.isPlaying = true;
		} else {
			this.warn('can not play now');
		}
	},
	pause: function() {
		if(this.isPlaying && this.canPlay) {
			this.bufferSource.stop();
		} else {
			this.warn('can not pause now');
		}
	},
	toggle: function() {
		this.isPlaying ? this.pause() : this.play();
	},
	endedWith: function(cb) {
		this.ended_cb = cb;
	},
	warn: function(msg) {
		console.warn(msg);
	}
};

init();

// init page
function init() {
	$(function() {
		$("amr").each(function() {
			new amrEvent($(this));
		});
	});
};

var amrEvent = function(amrEle) {
	this.initAmrEvent(amrEle);
};
amrEvent.prototype = {
	initAmrEvent: function(amrEle) {
		this.position = 0;
		this.flag = true;
		this.allTime = 0;
		this.initAmr(amrEle);
	},
	initAmr: function(amrEle) { // init amr element
		this.initStyle(amrEle);
		this.appendChild(amrEle);
		this.initAmrTime(amrEle);
		this.initClickEvent(amrEle);
	},
	initStyle: function(amrEle) { // init amr element style
		amrCss = {"width": "320px","height": "50px","padding": " 0 10px","border-radius": "25px","background": "#f1f3f4","display": "flex","font-size": "14px","align-items": "center","justify-content": "flex-start"};
		amrEle.css(amrCss);
	},
	appendChild: function(amrEle) { // append child in amr element
		// play img button  must only has 'name="playBtn"' this property; 
		// time span        must only has 'name="timeSpan"' this property;
		// progress         must only has 'name="progress"' this name="progress";
		// download button  must only has 'name="progress"' this name="downloadBtn";
		var child = '<img name="playBtn" src="https://img.miliantech.com/public/images/playIcon/play_btn.png" width="30px" height="30px"/><span name="timeSpan" style="padding: 0 10px;">0:0:00/0:0:00</span><progress name="progress" value="0" max="100"></progress><img name="downloadBtn" width="22" height="22" src="https://img.miliantech.com/public/images/playIcon/download_btn.png" style="margin-left: 12px;"/>'
		amrEle.empty().append(child);
	},
	initAmrTime: function(amrEle) { // init amr time
		var amrSrc = amrEle.attr("src");
		if(this.isAmrFile(amrSrc)) {
			this.showAmrTimes(amrEle, amrSrc);
		};
	},
	showAmrTimes: function(amrEle, amrSrc) { // show amr time
		var self = this;
		this.initAmrPlayer(amrSrc, false, function(allTime, currentTime, isOver) {
			self.setTimeSpan(amrEle, allTime, currentTime);
		});
	},
	initClickEvent: function(amrEle) { // init click event
		var self = this;
		amrEle.on("click", function(event) {
			if(event.stopPropagation()) {
				event.stopPropagation();
			} else {
				event.cancelBubble = true;
			}

			var selectBtn = $(event.target);
			if(self.isHasBtn(selectBtn, "playBtn")) {
				self.initPlayBtnClickEvent(amrEle);
			} else if(self.isHasBtn(selectBtn, "downloadBtn")) {
				self.initDownloadBtnClickEvent(amrEle, selectBtn);
			};
		});
	},
	initPlayBtnClickEvent: function(amrEle) { // init play button click event
		this.autoplay(this, amrEle);
	},
	initDownloadBtnClickEvent: function(amrEle, selectBtn) { // init download button click event
		var downloadBtn = amrEle.find(selectBtn);
		if(downloadBtn != undefined) {
			this.downloadFile(amrEle);
		} else {
			alert("not the download button, download img button must has ( name='downloadBtn' ) this property");
		};
	},
	changeAmrStyle: function(playBtn) { // change amr children style
		var self = this;
		var parent = playBtn.parent();
		if(!this.isAmrEle(parent)) {
			return;
		};
		var amrSrc = parent.attr("src");
		if(self.isAmrFile(amrSrc)) {
			self.initAmrPlayer(amrSrc, true, function(allTime, currentTime, isOver) {
				self.setTimeSpan(parent, allTime, currentTime);
				self.setPlayBtnIcon(parent, isOver);
				self.setProgressStatus(parent, allTime, currentTime);
			})
		} else {
			alert("amr address is wrong, please check amr address");
		}
	},
	initAmrPlayer: function(amrSrc, isPlay, time_cb) { // init amr player
		var self = this;
		this.player = new AmrPlayer(amrSrc, function(allTime) { // play start callBack
			self.allTime = allTime;
			time_cb && time_cb(self.allTime, self.position, false);
			if(isPlay) {
				self.player.pause();
				self.player.play();
				self.playTimer = setInterval(function() {
					self.position += 100;
					time_cb && time_cb(self.allTime, self.position, false);
				}, 100);
				self.flag = false;
			}
		}, function() { // download progress callBack
		}, function() { // play end callBack
			if(isPlay) {
				self.flag = true;
				clearInterval(self.playTimer);
				self.position = 0;
				time_cb && time_cb(self.allTime, self.position, true);
			}
		});
	},
	downloadFile: function(amrEle) { // download the file
		var amrSrc = amrEle.attr("src");
		if(this.isAmrFile(amrSrc)) {
			window.open(amrSrc);
		} else {
			alert("amr address is wrong, please check amr address");
		};
	},
	autoplay: function(self, amrEle) { // amr player autoplay
		var playBtn = amrEle.find("img[name=playBtn]")
		if(playBtn.length > 0) {
			if(self.flag) {
				self.changeAmrStyle(playBtn);
			} else {
				if(self.player != undefined) {
					self.player.toggle();
				}
				self.flag = true;
			};
		} else {
			alert("don't have the play button, play img button must has ( name='playBtn' ) this property");
		};
	},
	isAutoplay: function(amrEle) { // It's not used in this page (is has autoplay property);
		var autoplay = amrEle.attr("autoplay");
		return autoplay != undefined && autoplay == "autoplay";
	},
	isAmrEle: function(ele) { // is amr element
		return ele.prop("tagName").toLocaleLowerCase() == "amr" && ele.length > 0;
	},
	isAmrFile: function(amrSrc) { // is amr file
		return amrSrc != "" && amrSrc.indexOf(".amr") > 0 && amrSrc.substr(amrSrc.length - 4).toLowerCase() == ".amr";
	},
	isHasBtn: function(ele, nameValue) { // element is exist 
		return ele != undefined && ele.attr("name") == nameValue;
	},
	setTimeSpan: function(amrEle, allTime, currentTime) { // set time
		var timeSpan = amrEle.find("span[name=timeSpan]");
		if(timeSpan.length > 0) {
			var time = this.toSecond(currentTime) + "/" + this.toSecond(allTime);
			timeSpan.html(time);
		};
	},
	setPlayBtnIcon: function(amrEle, isOver) { // set play btn icon
		var playBtn = amrEle.find("img[name=playBtn]")
		if(playBtn.length > 0) {
			var src = isOver ? "https://img.miliantech.com/public/images/playIcon/play_btn.png" : "https://img.miliantech.com/public/images/playIcon/stop_btn.png";
			playBtn.attr("src", src);
		};
	},
	setProgressStatus: function(amrEle, allTime, currentTime) { // set progress status
		var progress = amrEle.find("progress[name=progress]")
		if(progress.length > 0) {
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
	}
};