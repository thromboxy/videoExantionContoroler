"use strict";

(function () {

    CACHE_NAME = 'tver';
    SPEED_CACHE_NAME = SPEED_CACHE_NAME_PRE + CACHE_NAME;
    let AD_SKIP_CACHE_NAME = 'SkipCacheFlag';

    NUM_KEY_FLAG = true;

    SITE_CONFIG = getConfig();

    let posX, posY, singleClickFlag, clickTimerId, replayFlag;

    /* サイト定義 */
    site = {
        getCanvas: function () {
            return document.querySelector('[class*="Controller_container__"]');
        },
        getFooter: function () {
            return document.querySelector('[class*="Controller_timeLabel__"]');
        },
        // ホイールイベント（音量)用にフッターを更新する
        getWheelEventFooter: function () {
            return document.querySelector('div[class="volume_slider__Lib_j"]');
        },
        getVideo: function () {
            // CMが存在すればCMを返却
            let adVideo = site.getAdVideo();
            return adVideo ?? document.querySelector('video[src*="blob:https://tver.jp/"]');
        },
        getAdVideo: function () {
            // CMが存在すればCMを返却
            return document.querySelector('video[title="Advertisement"][src*="https://"]')　// ?? document.querySelector('lima-video[src*=".mp4"]');
        },
        getSeekBar: function () {
            return document.querySelector('div[class="SeekBar_container__mcvNv"]');
        },
        getVideoSrc: function () {
            if (video) {
                return video.getAttribute('src');
            } else {
                return null;
            }
        },
        /* 自動動画再生 */
        autoPlayVideo: function () {
            let button = document.querySelector('.button_button__GOl5m.big-play-button_host__z6CnM');
            if (button && !replayFlag) {
                button.click();
            }
        },
        singleClick: function (e) {
            console.log(e.target.classList[0]);
            if (e.target.classList[0].startsWith('VodController_')) {
                posX = window.scrollX;
                posY = window.scrollY;
                document.querySelector('button[class*="Play_icon__"]').click();

                window.scroll(posX, posY);
            }
        },
        doubleClick: function (e) {
            console.log(e.target.classList[0]);
            if (e.target.classList[0].startsWith('VodController_')) {
                document.querySelector('button[class*="Fullscreen_icon__"]').click();
            }
        },
        getLiveFlag: function () {
            return false;
        },
        /* ボタンを設置する */
        setButton: function () {
            //footer.insertAdjacentHTML('afterend', '<label for="' + SKIP_CHECKBOX_ID + '" id="' + SKIP_CHECKBOX_LABEL + '" title="一部CMはｽｷｯﾌﾟできません" style="font-size: 13px;"><input type="checkbox" id="' + SKIP_CHECKBOX_ID + '" style="vertical-align: middle; margin-right: 4px;">CMｽｷｯﾌﾟ</label>');
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('afterend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" style="font-size:25px;margin-left: 2px;margin-right: 12px;padding-right:5px;padding-left:2px;">');
            footer.insertAdjacentHTML('afterend', '<span class="f15586js" id="' + SPEED_SPAN_ID + '" style="font-size: 15px;margin-left: 3px;padding-right:10px;padding-left:10px;"></span>');
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('afterend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<" style="font-size:25px;margin-left: 12px;padding-left:10px;">');
            if (SITE_CONFIG.seek_button) {
                footer.insertAdjacentHTML('afterend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" style="font-size:20px;margin-left: 12px;padding-right:10px;padding-left:10px;">');
                footer.insertAdjacentHTML('afterend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" style="font-size:20px;margin-left: 24px;padding-right:10px;padding-left:10px;">');
            }


        },

        /* 広告ｽｷｯﾌﾟ用ボタン設定*/
        setSkipButton: function () {
            // // 広告ｽｷｯﾌﾟ設定
            // let AdSkipButton = document.querySelector('#' + SKIP_CHECKBOX_ID);
            // let skipFlag = 'false';
            // if (localStorage.getItem(AD_SKIP_CACHE_NAME)) {
            //     skipFlag = localStorage.getItem(AD_SKIP_CACHE_NAME);
            // } else {
            //     localStorage.setItem(AD_SKIP_CACHE_NAME, false)
            // }
            // AdSkipButton.checked = JSON.parse(skipFlag.toLowerCase());

            // // ｽｷｯﾌﾟフラグが更新された時の動作
            // AdSkipButton.addEventListener('change', function () {
            //     let skipFlag = document.querySelector('#' + SKIP_CHECKBOX_ID).checked;
            //     localStorage.setItem(AD_SKIP_CACHE_NAME, skipFlag);
            // }, false);
        },

        /* 広告ｽｷｯﾌﾟ */
        skipAd: function () {
            let adVideo = document.querySelector('video[title="Advertisement"][src*="https://"]') // ?? document.querySelector('lima-video[src*=".mp4"]');
            if (adVideo) {
                let checkBox = document.querySelector('#' + SKIP_CHECKBOX_ID);
                if (checkBox && checkBox.checked) {
                    adVideo.currentTime = 1000;
                    clearInterval(interval);
                    core.initialize();
                    return;
                }
            }
        },

        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            // document.querySelector('.volume-slider_input__GwDal').value = volume;
            // var show = volume * 100;
            // var slider = document.querySelector('.volume-slider_active__n2cgm');
            // slider.setAttribute('style', 'width: ' + show.toFixed(0) + '%;');
        },
        /* レジュームキャッシュ名設定 */
        setResumeCacheName: function () {
            //console.log("setResumeCacheName");
            let sm = location.href.match(/(?<=episodes\/)[^/]+/)[1];
            if (sm) {
                RESUME_CACHE_NAME = RESUME_CACHE_NAME_PRE + CACHE_NAME + "_" + sm;
            } else {
                RESUME_CACHE_NAME = null;
            }
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
            let canvas = site.getCanvas();
            video = site.getVideo();
            footer = site.getFooter();
            seekBar = site.getSeekBar();


            if (!footer || !video || !seekBar || !canvas) {
                window.setTimeout(function () {
                    //console.log(SCRIPT_NAME, 'initialize timeout...', footer, video, seekBar, canvas);
                    site.autoPlayVideo();
                    core.initialize();
                }, INITIALIZE_TIMER);
                return;
            }

            /* キャッシュ読み込み */
            readCache();

            videoSrc = site.getVideoSrc();

            if (!document.querySelector('#' + SPEED_SPAN_ID)) {
                site.setButton();
                //site.setSkipButton();
                setOnClick();
                // イベントセット用にフッターを一時的に上書き
                footer = site.getWheelEventFooter();
                setEvent();
                footer = site.getFooter();
            }

            // canvas.addEventListener("click", site.canvasClick, e =>  {
            //     passive: false
            // });

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
                let canvas = site.getCanvas();
                if (!video || !canvas) {
                    clearInterval(interval);
                    initializeVideoData();
                    core.initialize();
                    replayFlag = true;
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
                    return;
                }
            }, 500);
        },
    };
    initializeVideoData();
    core.initialize();
})();