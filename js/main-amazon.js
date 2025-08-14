"use strict";

(function () {

    CACHE_NAME = 'amazon';
    SPEED_CACHE_NAME = SPEED_CACHE_NAME_PRE + CACHE_NAME;
    let AD_SKIP_CACHE_NAME = 'SkipCacheFlag';

    NUM_KEY_FLAG = true;
    SITE_CONFIG = getConfig();



    /* サイト定義 */
    site = {
        getCanvas: function () {
            return document.querySelector('.ffszj3z.f8hspre.f1icw8u');
        },
        getFooter: function () {
            let footer = document.querySelector('#dv-web-player-2 .fage5o5.f1mic5r1');
            if (!footer) footer = document.querySelector('#dv-web-player .fage5o5.f1mic5r1');
            return footer;
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
        singleClick: function () {
            return null;
        },
        doubleClick: function (e) {
            if (e.target.tagName == 'IMG') return;
            let button = document.querySelector('#dv-web-player-2 .atvwebplayersdk-fullscreen-button');
            if (!button) button = document.querySelector('#dv-web-player .atvwebplayersdk-fullscreen-button');
            if(!button) return;
            button.click();            
        },
        getLiveFlag: function () {
            return false;
        },
        getSkipButton: function () {
            var button = document.querySelector('.fu4rd6c.f1cw2swo');
            if (button && 'スキップ' == button.innerText) {
                return button;
            }
            return null;
        },
        /* ボタンを設置する */
        setButton: function () {
            if (SITE_CONFIG.seek_button) {
                footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="ytp-miniplayer-button ytp-button" style="font-size:150%;margin-left: 24px;padding-right:10px;padding-left:10px;">');
                footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="ytp-miniplayer-button ytp-button" style="font-size:150%;margin-left: 12px;padding-right:10px;padding-left:10px;">');
            }
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="ytp-miniplayer-button ytp-button" style="font-size:170%;margin-left: 24px;padding-right:10px;padding-left:10px;">');
            footer.insertAdjacentHTML('beforeend', '<span class="f15586js" id="' + SPEED_SPAN_ID + '" style="font-size:120%;margin-left: 5px;padding-right:10px;padding-left:10px;"></span>');
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('beforeend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="ytp-miniplayer-button ytp-button" style="font-size:170%;margin-left: 2px;margin-right: 24px;padding-right:10px;padding-left:2px;">');
            //footer.insertAdjacentHTML('beforeend', '<label for="' + SKIP_CHECKBOX_ID + '" id="' + SKIP_CHECKBOX_LABEL + '" style="font-size:70%;margin-left: 2px;margin-right: 24px;padding-right:10px;padding-left:2px;width: 139px;"><input type="checkbox" id="' + SKIP_CHECKBOX_ID + '" "ytp-miniplayer-button ytp-button" style="font-size:170%;margin-left: 2px;margin-right: 5px;padding-right:10px;padding-left:2px;height: 17px;">広告ｽｷｯﾌﾟ</label>');

        },

        /* 広告ｽｷｯﾌﾟ用ボタン設定*/
        setSkipButton: function () {
            // 広告ｽｷｯﾌﾟ設定
            let AdSkipButton = document.querySelector('#' + SKIP_CHECKBOX_ID);
            let skipFlag = 'false';
            if (localStorage.getItem(AD_SKIP_CACHE_NAME)) {
                skipFlag = localStorage.getItem(AD_SKIP_CACHE_NAME);
            } else {
                localStorage.setItem(AD_SKIP_CACHE_NAME, false)
            }
            AdSkipButton.checked = JSON.parse(skipFlag.toLowerCase());

            // ｽｷｯﾌﾟフラグが更新された時の動作
            AdSkipButton.addEventListener('change', function () {
                let skipFlag = document.querySelector('#' + SKIP_CHECKBOX_ID).checked;
                localStorage.setItem(AD_SKIP_CACHE_NAME, skipFlag);
            }, false);


        },

        /* 広告ｽｷｯﾌﾟ */
        skipAd: function () {
            let skipButton = site.getSkipButton();
            //alert(skipButton);
            if (skipButton) {
                let skipFlag = document.querySelector('#' + SKIP_CHECKBOX_ID).checked;
                if (skipFlag) {
                    skipButton.click();
                }
            }
        },

        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            // amazonは自動で設定してくれる
        },
        /* レジュームキャッシュ名設定 */
        setResumeCacheName: function () {
            // amazonはIDとれない
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
                    //console.log(SCRIPT_NAME, 'initialize timeout...');
                    core.initialize();
                }, INITIALIZE_TIMER);
                return;
            }


            /* キャッシュ読み込み */
            readCache();

            videoSrc = site.getVideoSrc();

            if (!document.querySelector('#' + TIME_BACK_ID)) {
                site.setButton();
                // site.setSkipButton();
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
                // console.log(SCRIPT_NAME, 'interval...');
                video = site.getVideo();

                if (!video) {
                    clearInterval(interval);
                    initializeVideoData();
                    core.initialize();
                    return;
                }

                videoSrc = site.getVideoSrc();
                video.playbackRate = VIDEO_SPEED;
                showVideoSpeed();
                site.skipAd();


                if (videoSrc != videoSrcOld) {
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    initializeVideoData();
                    core.initialize();
                }
            }, 500);
        },
    };
    initializeVideoData();
    core.initialize();
})();