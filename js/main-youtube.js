"use strict";

(function () {

    CACHE_NAME = 'YoutubeVideoSpeed';

    sheet.insertRule('.ytp-time-wrappe {'
        + 'height: 60%;'
        + 'margin-top: 0.9%;'
        + 'border-radius: 28px;'
        + 'text-align: center;'
        + 'width: auto;'
        + 'line-height: normal;'
        + 'padding: 0 16px;'
        // + '-webkit-backdrop-filter: blur(16px);'
        + 'backdrop-filter: blur(16px);'
        + 'background: var(--yt-spec-static-overlay-additive-background,rgba(40,40,40,.6));'
         , 1);



    /* サイト定義 */
    site = {
        getCanvas: function () {
            return document.querySelector('.html5-video-container');
        },
        getFooter: function () {
            let selecter = '.ytp-left-controls';
            // シアターモードの場合のプレイヤー
            let player = document.querySelector('#ytd-player');
            if (player) {
                return player.querySelector(selecter);
            }
        },
        getVideo: function () {
            return document.querySelector('video[src*="blob:https://www.youtube.com/"]');
        },
        getSeekBar: function () {
            let selecter = '.ytp-progress-bar-container';
            // シアターモードの場合のプレイヤー
            let player = document.querySelector('#ytd-player');
            if (player) {
                return player.querySelector(selecter);
            }
        },
        singleClick: function() {
            return null;
        },
        doubleClick: function() {
            return null;
        },
        getLiveFlag: function () {
            if (document.querySelector('.ytp-time-display.notranslate.ytp-live')) {
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
        /* ボタンを設置する */
        setButton: function () {
            removeBottun();
            footer.insertAdjacentHTML('beforeend', '<div class="ytp-time-wrappe notranslate">'
                +'<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="ytp-miniplayer-button ytp-button" style="vertical-align:top;font-size:180%;">'
                +'<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="ytp-miniplayer-button ytp-button" style="vertical-align:top;font-size:180%;">'
                +'<input type="button" id="' + SPEED_DOWN_ID + '" value="">'
                +'<span class="ytp-button" id="' + SPEED_SPAN_ID + '" style="font-size:130%;margin-top:6.5%;"></span>'
                +'<input type="button" id="' + SPEED_UP_ID + '" value="">'
                +'</div>'
            );
            // footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="ytp-miniplayer-button ytp-button" style="vertical-align:top;font-size:180%;margin-left: 10px;padding-right:15px;">');
            // footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="ytp-miniplayer-button ytp-button" style="vertical-align:top;font-size:180%;margin-left: 10px;padding-right:15px;">');

            // footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="ytp-miniplayer-button ytp-button" style="vertical-align:top;font-size:220%;margin-left: 14px;width:22px">');
            // footer.insertAdjacentHTML('beforeend', '<span class="ytp-time-display" id="' + SPEED_SPAN_ID + '" style="font-size:130%;margin-left: 5px;padding-right:10px;padding-left:0px;"></span>');
            // footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="ytp-miniplayer-button ytp-button" style="vertical-align:top;font-size:220%;padding-right:10px;">');
            // footer.insertAdjacentHTML('beforeend', '</div>');
        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            let show = volume * 77;
            document.querySelector('.ytp-volume-slider-handle').style.cssText = 'left: ' + show.toFixed(0) + '%;';
            show = volume * 100;
            var panel = document.querySelector('.ytp-volume-panel');
            panel.setAttribute('aria-valuenow', show.toFixed(0));
            panel.setAttribute('aria-valuetext', show.toFixed(0) + '% 音量');
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
                    //console.log(SCRIPT_NAME, video, footer, seekBar, 'initialize timeout...');
                    core.initialize();
                }, INITIALIZE_TIMER);
                return;
            }

            /* キャッシュ読み込み */
            readCache();

            liveFlag = site.getLiveFlag();
            if (liveFlag) {
                VIDEO_SPEED = 1.00;
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
            core.setInterval();
        },

        /* FPSタイマー駆動 */
        setInterval: function () {
            //console.log(SCRIPT_NAME, 'setInterval...');
            interval = window.setInterval(function () {
                //console.log(SCRIPT_NAME, videoSrc, 'interval...');
                video = site.getVideo();

                if (!video) {
                    clearInterval(interval);
                    core.initialize();
                    return;
                }

                // let confirmButton = document.querySelector('#confirm-button');
                // if(confirmButton){
                //     confirmButton.click();
                // }
                videoSrc = site.getVideoSrc();
                video.playbackRate = VIDEO_SPEED;
                showVideoSpeed();

                if (videoSrc != videoSrcOld) {
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    core.initialize();
                }
            }, 500);
        },
    };
    core.initialize();
})();