"use strict";

(function () {

    let RESET_CANVAS_FLAG;
    RESET_CANVAS_FLAG = false;
    let NEED_RESUME;
    NEED_RESUME = true;

    CACHE_NAME = 'niconico';
    SPEED_CACHE_NAME = SPEED_CACHE_NAME_PRE + CACHE_NAME;
    SITE_CONFIG = getConfig();

    NUM_KEY_FLAG = true;

    // 広告非表示等
    sheet.insertRule('.ActionButton.PlaybackRateButton, .SideFollowAdContainer, #RectangleAd, .NicoSpotAdContainer, .PreVideoStartPremiumLinkOnEconomyTimeContainer, .MainContainer-marquee, .PlayerOverlayBottomMessage.PreVideoStartPremiumLinkContainer { display:none; style:"";}', 1);

    let marquee, posX, posY, singleClickFlag, clickTimerId;
    /* サイト定義 */
    site = {
        getCanvas: function () {
            return document.querySelector('div[data-styling-id="«r2»"]');
        },
        getFooter: function () {
            var parent = document.querySelector('div[data-styling-id="«r4»"]');
            if (parent) {
                return parent.childNodes[0].childNodes[1].childNodes[4];
            } else if (document.querySelector('div[data-styling-id="«r2»"]')) {
                return document.querySelector('div[data-styling-id="«r2»"]').childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[4];
            }
            return null;
        },
        getVideo: function () {
            return document.querySelector('video[src]');
        },
        getSeekBar: function () {
            var parent = document.querySelector('div[data-styling-id="«r4»"]');
            if (parent) {
                return parent.childNodes[0].childNodes[0].childNodes[0];
            } else if (document.querySelector('div[data-styling-id="«r2»"]')) {
                return document.querySelector('div[data-styling-id="«r2»"]').childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0];
            }
            return null;
        },
        getVideoSrc: function () {
            if (video) {
                return video.getAttribute('src');
            } else {
                return null;
            }
        },
        getSupporterViewVisibility: function () {
            let style = document.querySelector('div[class="SupporterView"]').getAttribute('style');
            if (style == 'visibility: visible;') {
                return true;
            }
            return false;
        },
        singleClick: function () {
            // posX = window.scrollX;
            // posY = window.scrollY;
            // if (document.querySelector('.ActionButton.ControllerButton.PlayerPlayButton')) {
            //     document.querySelector('.ActionButton.ControllerButton.PlayerPlayButton').click();
            // } else {
            //     document.querySelector('.ActionButton.ControllerButton.PlayerPauseButton').click();
            // }
            // window.scroll(posX, posY);
        },
        doubleClick: function (e) {
            if (e.target.tagName == 'DIV' || e.target.tagName == 'VIDEO') {
                if (document.querySelector('button[aria-label="全画面表示する"]')) {
                    document.querySelector('button[aria-label="全画面表示する"]').click();
                } else {
                    document.querySelector('button[aria-label="全画面表示を終了"]').click();
                }
            }
        },
        getLiveFlag: function () {
            return false;
        },
        /* ボタンを設置する */
        setButton: function () {
            if (SITE_CONFIG.seek_button) {
                footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="cursor_pointer" style="font-size:120%;margin-left: 6px;color: white;">');
                footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="cursor_pointer" style="font-size:120%;color: white;">');
            }
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="cursor_pointer" style="font-size:120%;margin-left: 6px;color: white;">');
            footer.insertAdjacentHTML('beforebegin', '<span class="ControllerButton-inner" id="' + SPEED_SPAN_ID + '" style="font-size:110%;"></span>');
            if (SITE_CONFIG.speed_button) footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="cursor_pointer" style="font-size:120%;color: white;">');

        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            // document.querySelector('div[aria-label="volume"]').style.cssText = 'transform: scaleX(' + volume.toFixed(4) + ');';
        },
        /* レジュームキャッシュ名設定 */
        setResumeCacheName: function () {
            //console.log("setResumeCacheName");
            let sm = location.href.match(/watch\/([^\/?#]+)/);
            if (sm) {
                RESUME_CACHE_NAME = RESUME_CACHE_NAME_PRE + CACHE_NAME + "_" + sm[1];
            } else {
                RESUME_CACHE_NAME = null;
            }
        },
        /* 提供画面ｽｷｯﾌﾟ */
        clickNextButton: function () {
            let nextButton = document.querySelector('.ActionButton.ControllerButton.PlayerSkipNextButton');
            let continuousLabel = document.querySelector('.Toggle.is-checked.is-append')?.querySelector('.Toggle-checkbox')?.checked;
            if (continuousLabel) {
                nextButton.click();
                clearInterval(interval);
                core.initialize();
            }
        },
    };

    /* 処理本体 */
    core = {
        /* 初期化 */
        initialize: function () {
            // console.log(SCRIPT_NAME, 'initialize...');

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
                    core.initialize();
                }, INITIALIZE_TIMER);
                return;
            }

            initializeVideoData();

            readCache();
            site.setResumeCacheName();
            readResumeCache();

            videoSrc = site.getVideoSrc();

            if (!document.querySelector('#' + SPEED_SPAN_ID)) {
                site.setButton();
                setOnClick();
                setEvent();
            } else if (RESET_CANVAS_FLAG) {
                setHoldCanvas(site.getCanvas());
                RESET_CANVAS_FLAG = false;
            }

            video.playbackRate = VIDEO_SPEED;
            showVideoSpeed();
            videoSrcOld = videoSrc;
            core.setInterval();
        },

        /* FPSタイマー駆動 */
        setInterval: function () {
            // console.log(SCRIPT_NAME, 'setInterval...');
            interval = window.setInterval(function () {
                //console.log(SCRIPT_NAME, 'interval...');
                video = site.getVideo();

                if (!video) {
                    NEED_RESUME = true;
                    clearInterval(interval);
                    initializeVideoData();
                    core.initialize();
                    return;
                } else if (!document.querySelector('#' + SPEED_SPAN_ID)) {
                    NEED_RESUME = false;
                    clearInterval(interval);
                    initializeVideoData();
                    core.initialize();
                    return;
                }
                videoSrc = site.getVideoSrc();
                video.playbackRate = VIDEO_SPEED;
                showVideoSpeed();

                if (videoSrc != videoSrcOld) {
                    NEED_RESUME = true;
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    initializeVideoData();
                    core.initialize();
                }
                saveResumeCache();

            }, 200);
        },
    };

    initializeVideoData();
    core.initialize();
})();