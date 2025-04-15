"use strict";

(function () {

    let RESET_CANVAS_FLAG;
    RESET_CANVAS_FLAG = false;
    let NEED_RESUME;
    NEED_RESUME = true;

    CACHE_NAME = 'NiconicoVideoSpeed';

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
            if(parent){
                return parent.childNodes[0].childNodes[1].childNodes[4];
            }else if(document.querySelector('div[data-styling-id="«r2»"]')){
                return document.querySelector('div[data-styling-id="«r2»"]').childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[4];
            }
            return null;
        },
        getVideo: function () {
            return document.querySelector('video[src]');
        },
        getSeekBar: function () {
            var parent = document.querySelector('div[data-styling-id="«r4»"]');
            if(parent){
                return parent.childNodes[0].childNodes[0].childNodes[0];
            }else if(document.querySelector('div[data-styling-id="«r2»"]')){
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
            if (!e.target.getAttribute('role') && e.target.tagName == 'DIV'){
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
            footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="cursor_pointer" style="font-size:120%;margin-left: 6px;color: white;">');
            footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="cursor_pointer" style="font-size:120%;color: white;">');

            footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="cursor_pointer" style="font-size:120%;margin-left: 6px;color: white;">');
            footer.insertAdjacentHTML('beforebegin', '<span class="ControllerButton-inner" id="' + SPEED_SPAN_ID + '" style="font-size:110%;"></span>');
            footer.insertAdjacentHTML('beforebegin', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="cursor_pointer" style="font-size:120%;color: white;">');

        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            // document.querySelector('div[aria-label="volume"]').style.cssText = 'transform: scaleX(' + volume.toFixed(4) + ');';
        },
        /* レジュームキャッシュ名設定 */
        setResumeCacheName: function () {
            let sm = location.href.match('/watch/[a-z][a-z][0-9]{2,20}');
            if (sm) {
                RESUME_CACHE_NAME = CACHE_NAME + sm;
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

            resumeTime = 0;

            if(NEED_RESUME){
                /* キャッシュ読み込み */
                readCache();
                site.setResumeCacheName();
                readResumeCache();
            }else{
                NEED_RESUME = true;
            }

            videoSrc = site.getVideoSrc();



            if (!document.querySelector('#' + TIME_BACK_ID)) {
                site.setButton();
                setOnClick();
                setEvent();
            }else if (RESET_CANVAS_FLAG) {
                setHoldCanvas(site.getCanvas());
                RESET_CANVAS_FLAG = false;
            }
            //canvas.addEventListener("click", site.canvasClick);

            video.playbackRate = VIDEO_SPEED;
            showVideoSpeed();
            videoSrcOld = videoSrc;
            core.setInterval();
        },

        /* FPSタイマー駆動 */
        setInterval: function () {
            // console.log(SCRIPT_NAME, 'setInterval...');
            interval = window.setInterval(function () {
                // console.log(SCRIPT_NAME, 'interval...');
                video = site.getVideo();

                if (!video) {
                    NEED_RESUME = true;
                    clearInterval(interval);
                    core.initialize();
                    return;
                }else if(!document.querySelector('#' + SPEED_SPAN_ID)) {
                    NEED_RESUME = false;
                    clearInterval(interval);
                    core.initialize();
                    return;
                }

                

                videoSrc = site.getVideoSrc();
                video.playbackRate = VIDEO_SPEED;
                showVideoSpeed();

                // if (site.getSupporterViewVisibility()) {
                //     RESET_CANVAS_FLAG = true;
                //     site.clickNextButton();
                // }

                if (videoSrc != videoSrcOld) {
                    NEED_RESUME = true;
                    videoSrcOld = videoSrc;
                    clearInterval(interval);
                    core.initialize();
                }
                saveResumeCache();

            }, 200);
        },
    };
    core.initialize();
})();