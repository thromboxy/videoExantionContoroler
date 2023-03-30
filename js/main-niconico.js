"use strict";

(function () {

    CACHE_NAME = 'NiconicoVideoSpeed';

    NUM_KEY_FLAG = true;

    sheet.insertRule('.SideFollowAdContainer, #RectangleAd, .NicoSpotAdContainer, .PreVideoStartPremiumLinkOnEconomyTimeContainer, .SeekBarHoverItem, .MainContainer-marquee, .PlayerOverlayBottomMessage.PreVideoStartPremiumLinkContainer { display:none; style:"";}', 1);

    let marquee, posX, posY;

    /* サイト定義 */
    site = {
        getFooter: function () {
            return document.querySelector('.ControllerContainer-area');
        },
        getVideo: function () {
            return document.querySelector('video[src]');
        },
        getSeekBar: function () {
            return document.querySelector('.SeekBarContainer');
        },
        getVideoSrc: function () {
            if (video) {
                return video.getAttribute('src');
            } else {
                return null;
            }
        },
        /* 再生停止ボタンをクリック */
        playButtonClick: function () {
            posX = window.scrollX;
            posY = window.scrollY;
            if (document.querySelector('.ActionButton.ControllerButton.PlayerPlayButton')) {
                document.querySelector('.ActionButton.ControllerButton.PlayerPlayButton').click();
            } else {
                document.querySelector('.ActionButton.ControllerButton.PlayerPauseButton').click();
            }
            window.scroll(posX,posY);
        },
        /* フルスクリーンボタンをクリック */
        fullScreenButtonClick: function () {
            if (document.querySelector('.ActionButton.ControllerButton.EnableFullScreenButton')) {
                document.querySelector('.ActionButton.ControllerButton.EnableFullScreenButton').click();
            } else {
                document.querySelector('.ActionButton.ControllerButton.DisableFullScreenButton').click();
            }
        },
        getLiveFlag: function () {
            return false;
        },
        /* ボタンを設置する */
        setButton: function () {
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="ControllerButton-inner" style="font-size:120%;margin-left: 6px;">');
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="ControllerButton-inner" style="font-size:120%;">');

            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="ControllerButton-inner" style="font-size:130%;margin-left: 6px;">');
            footer.insertAdjacentHTML('beforeend', '<span class="ControllerButton-inner" id="' + SPEED_SPAN_ID + '" style="font-size:110%;"></span>');
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="ControllerButton-inner" style="font-size:130%;">');

        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            document.querySelector('.ProgressBar-inner.VolumeBar-progress').style.cssText = 'transform: scaleX(' + volume.toFixed(4) + ');';
            document.querySelector('.Tooltip-inner').innerHTML = '音量 : ' + (volume * 100).toFixed(0);
        },
        /* レジュームキャッシュ名設定 */
        setResumeCacheName: function () {
            let sm = location.href.match('/watch/[a-z][a-z][0-9]{2,20}');
            if(sm){
                RESUME_CACHE_NAME = CACHE_NAME + sm;
            }else{
                RESUME_CACHE_NAME = null;
            }
        }
    };

    /* 処理本体 */
    core = {
        /* 初期化 */
        initialize: function () {
            //console.log(SCRIPT_NAME, 'initialize...');

            /* 主要要素が取得できるまで読み込み待ち */
            video = null;
            footer = null;
            seekBar = null;
            video = site.getVideo();
            footer = site.getFooter();
            seekBar = site.getSeekBar();

            if (!footer || !video || !seekBar) {
                window.setTimeout(function () {
                    // console.log(SCRIPT_NAME, 'initialize timeout...');
                    core.initialize();
                }, 1000);
                return;
            }

            resumeTime = 0;

            /* キャッシュ読み込み */
            readCache();
            
            videoSrc = site.getVideoSrc();

            site.setResumeCacheName();
            readResumeCache();

            if (!document.querySelector('#' + TIME_BACK_ID)) {
                site.setButton();
                setOnClick();
                setEvent();

            }

            document.querySelector('.VideoSymbolContainer-canvas').addEventListener("click", site.playButtonClick, {
                passive: false
            });
            
            document.querySelector('.VideoSymbolContainer-canvas').addEventListener("dblclick", site.fullScreenButtonClick, {
                passive: false
            });

            video.playbackRate = VIDEO_SPEED;
            showVideoSpeed();
            videoSrcOld = videoSrc;
            core.setInterval();
        },

        /* FPSタイマー駆動 */
        setInterval: function () {
            //console.log(SCRIPT_NAME, 'setInterval...');
            interval = window.setInterval(function () {
                //console.log(SCRIPT_NAME, 'interval...');
                video = site.getVideo();

                if (!video) {
                    clearInterval(interval);
                    core.initialize();
                    return;
                }

                videoSrc = site.getVideoSrc();
                video.playbackRate = VIDEO_SPEED;

                

                if (videoSrc != videoSrcOld) {
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    core.initialize();
                }
                saveResumeCache();
            }, 100);
        },
    };
    core.initialize();
})();