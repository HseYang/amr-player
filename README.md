amr-player
play remote amr format audio with JavaScript  

copy by https://github.com/alex374/amr-player;
	
After that, I revised it to make it better.

## 2018.7.26：
	- 1.1.0
	- if the url not include ".amr", then use "audio" element play
	
## 2018.7.16：
	- 1.0.0
	- can simply play amr file, can play multiple amr at the same time
	
### AmrPlayer usage:
	
   > <body>
	   <amr src="xx.amr" autoplay="autoplay"></amr>
	   <script src="amr-player-master/jquery-1.8.3.min.js" type="text/javascript" charset="utf-8"></script>
	   <script src="amr-player-master/amrnb.js" type="text/javascript" charset="utf-8"></script>
	   <script src="amr-player-master/amrplayer.js" type="text/javascript" charset="utf-8"></script>
   </body>
   
#### property:
	> src : amr url
	  autoplay : can autoplay
   
### show amr player: 
![amrPayer](amrPlayer.png "amrPayer")
   
   
