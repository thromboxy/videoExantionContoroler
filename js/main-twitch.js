"use strict";

(function () {

    CACHE_NAME = 'twitch';
    SPEED_CACHE_NAME = SPEED_CACHE_NAME_PRE + CACHE_NAME;
    NUM_KEY_FLAG = true;
    
    SITE_CONFIG = getConfig();
    
    /* サイト定義 */
    site = {
        getCanvas: function () {
            return document.querySelector('div[data-a-target="player-overlay-click-handler"]');
        },
        getFooter: function () {
            var length = document.querySelectorAll('.player-controls__left-control-group').length;
            return document.querySelectorAll('.player-controls__left-control-group')[0];
        },
        getVideo: function () {
            return document.querySelector('video');
        },
        getSeekBar: function () {
            var length = document.querySelectorAll('.seekbar-interaction-area').length;
            return document.querySelectorAll('.seekbar-interaction-area')[0];
        },
        singleClick: function() {
            return null;
        },
        doubleClick: function() {
            return null;
        },
        getLiveFlag: function () {
            if (!site.getSeekBar()) {
                return true;
            } else {
                return false;
            }
        },
        getVideoSrc: function () {
            if (video) {
                return video.getAttribute('src');
            } else {
                return null;
            }
        },
        /* ビデオスピードを表示する */
        showVideoSpeed: function () {
            document.querySelector('#' + SPEED_SPAN_ID).innerText = VIDEO_SPEED.toFixed(2);
        },

        /* ボタンを設置する */
        setButton: function () {
            if (SITE_CONFIG.seek_button) {
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="Layout-sc-nxg1ff-0 ScAttachedTooltipWrapper-sc-v8mg6d-0 ggANPd" style="font-size:200%;margin-left: 12px;padding-right:2px;padding-left:10px;">');
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="Layout-sc-nxg1ff-0 ScAttachedTooltipWrapper-sc-v8mg6d-0 ggANPd" style="vertical-align:top;font-size:200%;margin-left: 6px;padding-right:10px;padding-left:6px;">');
            }
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="Layout-sc-nxg1ff-0 ScAttachedTooltipWrapper-sc-v8mg6d-0 ggANPd" style="vertical-align:top;font-size:200%;margin-left: 12px;padding-right:2px;padding-left:10px;">');
            footer.insertAdjacentHTML('beforeend', '<span class="Layout-sc-nxg1ff-0 ScAttachedTooltipWrapper-sc-v8mg6d-0 ggANPd" id="' + SPEED_SPAN_ID + '" style="font-size:150%;margin-left: 5px;padding-right:10px;padding-left:5px;"></span>');
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="Layout-sc-nxg1ff-0 ScAttachedTooltipWrapper-sc-v8mg6d-0 ggANPd" style="vertical-align:top;font-size:180%;margin-left: 2px;margin-right: 24px;padding-right:10px;padding-left:2px;">');
        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {

        }
    };

    /* 処理本体 */
    core = {
        /* 初期化 */
        initialize: function () {
            //console.log(SCRIPT_NAME, 'initialize...');

            removeBottun();
            
            /* 主要要素が取得できるまで読み込み待ち */
            video = null;
            footer = null;
            seekBar = null;
            liveFlag = null;
            video = site.getVideo();
            footer = site.getFooter();
            seekBar = site.getSeekBar();
            liveFlag = site.getLiveFlag();

            if (!footer || !video || !seekBar) {
                window.setTimeout(function () {
                    // console.log(SCRIPT_NAME, 'initialize timeout...');
                    core.initialize();
                }, INITIALIZE_TIMER);
                return;
            }


            if (liveFlag) {
                VIDEO_SPEED = 1.00;
            }else{
                /* キャッシュ読み込み */
                readCache();
            }

            videoSrc = site.getVideoSrc();

            if (!document.querySelector('#' + SPEED_SPAN_ID)) {
                site.setButton();
                setOnClick();
                setEvent();
            }

            video.playbackRate = VIDEO_SPEED;
            showVideoSpeed();
            videoSrcOld = videoSrc;
            urlOld = url;
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

                if(!site.getLiveFlag){
                    readCache();
                }
                video.playbackRate = VIDEO_SPEED;
                showVideoSpeed();
                if (videoSrc != videoSrcOld) {
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    core.initialize();
                    return;
                }
            }, 1000);
        },
    };
    core.initialize();
})();