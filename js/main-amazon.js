"use strict";

(function () {

    CACHE_NAME = 'AmazonVideoSpeed';

    NUM_KEY_FLAG = true;
    
    /* サイト定義 */
    site = {
        getFooter: function () {
            return document.querySelector('.fage5o5.f1mic5r1');
        },
        getVideo: function () {
            return document.querySelector('video[src*="blob:https://www.amazon.co.jp/"]');
        },
        getSeekBar: function () {
            return document.querySelector('.ffc8rcx');
        },
        getVideoSrc: function () {
            if (video) {
                return video.getAttribute('src');
            } else {
                return null;
            }
        },
        getLiveFlag: function () {
                return false;
        },
        /* ボタンを設置する */
        setButton: function () {
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="ytp-miniplayer-button ytp-button" style="font-size:150%;margin-left: 24px;padding-right:10px;padding-left:10px;">');
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="ytp-miniplayer-button ytp-button" style="font-size:150%;margin-left: 12px;padding-right:10px;padding-left:10px;">');

            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="ytp-miniplayer-button ytp-button" style="font-size:170%;margin-left: 24px;padding-right:10px;padding-left:10px;">');
            footer.insertAdjacentHTML('beforeend', '<span class="f15586js" id="' + SPEED_SPAN_ID + '" style="font-size:120%;margin-left: 5px;padding-right:10px;padding-left:10px;"></span>');
            footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="ytp-miniplayer-button ytp-button" style="font-size:170%;margin-left: 2px;margin-right: 24px;padding-right:10px;padding-left:2px;">');
        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            // amazonは自動で設定してくれる
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
                    console.log(SCRIPT_NAME, 'initialize timeout...');
                    core.initialize();
                }, 1000);
                return;
            }


            /* キャッシュ読み込み */
            readCache();

            videoSrc = site.getVideoSrc();

            if (!document.querySelector('#' + TIME_BACK_ID)) {
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
                console.log(SCRIPT_NAME, 'interval...');
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
            }, 1000);
        },
    };
    core.initialize();
})();