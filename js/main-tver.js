"use strict";

(function () {

    CACHE_NAME = 'TVerVideoSpeed';
    let AD_SKIP_CACHE_NAME = 'SkipCacheFlag';

    NUM_KEY_FLAG = true;

    let posX, posY, singleClickFlag, clickTimerId, replayFlag;

    /* サイト定義 */
    site = {
        getCanvas: function () {
            return document.querySelector('.controller_container__PMXA9');
        },
        getFooter: function () {
            return document.querySelector('.controller_hidable__DnlQd');
        },
        // ホイールイベント（音量)用にフッターを更新する
        getWheelEventFooter: function () {
            return document.querySelector('.controller_buttons__t_OZ5');
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
            return document.querySelector('.progress_container__C3IB_');
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
        /* 画面をクリック */
        canvasClick: function (e) {
            singleClickFlag = !singleClickFlag;

            if (singleClickFlag) {
                clickTimerId = window.setTimeout(singleClick, 250, e);
            } else {
                window.clearTimeout(clickTimerId);
                singleClickFlag = false;
                doubleClick(e)
            }

            /* 再生停止ボタンをクリック */
            function singleClick(e) {
                if (e.target.classList[0] == 'controller_container__PMXA9') {
                    posX = window.scrollX;
                    posY = window.scrollY;
                    document.querySelector('.button_button__GOl5m.toggle-playing-button_controlButton__aiuq3').click();
    
                    window.scroll(posX, posY);
                }
                singleClickFlag = false;
            }

            /* フルスクリーンボタンをクリック */
            function doubleClick(e) {
                if (e.target.classList[0] == 'controller_container__PMXA9') {
                    document.querySelector('img[alt="全画面').click();
                }
            }
        },
        getLiveFlag: function () {
            return false;
        },
        /* ボタンを設置する */
        setButton: function () {
            footer.insertAdjacentHTML('afterend', '<label for="' + SKIP_CHECKBOX_ID + '" id="' + SKIP_CHECKBOX_LABEL + '" title="一部CMはｽｷｯﾌﾟできません" style="font-size: 13px;"><input type="checkbox" id="' + SKIP_CHECKBOX_ID + '" style="vertical-align: middle; margin-right: 4px;">CMｽｷｯﾌﾟ</label>');
            footer.insertAdjacentHTML('afterend', '<input type="button" id="' + SPEED_UP_ID + '" value=">" style="font-size:25px;margin-left: 2px;margin-right: 12px;padding-right:5px;padding-left:2px;">');
            footer.insertAdjacentHTML('afterend', '<span class="f15586js" id="' + SPEED_SPAN_ID + '" style="font-size: 15px;margin-left: 3px;padding-right:10px;padding-left:10px;"></span>');
            footer.insertAdjacentHTML('afterend', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<" style="font-size:25px;margin-left: 12px;padding-left:10px;">');

            footer.insertAdjacentHTML('afterend', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" style="font-size:20px;margin-left: 12px;padding-right:10px;padding-left:10px;">');
            footer.insertAdjacentHTML('afterend', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" style="font-size:20px;margin-left: 24px;padding-right:10px;padding-left:10px;">');

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
                    //console.log(SCRIPT_NAME, 'initialize timeout...');
                    site.autoPlayVideo();
                    core.initialize();
                }, 500);
                return;
            }

            /* キャッシュ読み込み */
            readCache();

            videoSrc = site.getVideoSrc();

            if (!document.querySelector('#' + TIME_BACK_ID)) {
                site.setButton();
                site.setSkipButton();
                setOnClick();
                // イベントセット用にフッターを一時的に上書き
                footer = site.getWheelEventFooter();
                setEvent();
                footer = site.getFooter();
            }

            canvas.addEventListener("click", site.canvasClick, e =>  {
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
                let canvas = site.getCanvas();
                if (!video || !canvas) {
                    clearInterval(interval);
                    core.initialize();
                    replayFlag = true;
                    return;
                }

                videoSrc = site.getVideoSrc();
                video.playbackRate = VIDEO_SPEED;
                site.skipAd();

                if (videoSrc != videoSrcOld) {
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    core.initialize();
                    return;
                }
            }, 500);
        },
    };
    core.initialize();
})();