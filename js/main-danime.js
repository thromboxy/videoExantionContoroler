"use strict";

(function () {

    CACHE_NAME = 'DanimeVideoSpeed';

    NUM_KEY_FLAG = true;
    
    let linkId = 'addLinkId';
    /* サイト定義 */
    site = {
        setVideoLink: function () {
            if(document.querySelector('a[id="'+linkId+'"]'))return;

            let param = location.search;
            let partId = getParam('partId', param);
            if(partId) {
                let img = document.querySelector('#modalThumbImg');
                if(img){
                    img.outerHTML = '<a href="https://anime.dmkt-sp.jp/animestore/sc_d_pc?partId='+partId+'" id = "'+ linkId +'">' + img.outerHTML + '</a>';
                }
            }

            function getParam(name, url) {
                if (!url) url = window.location.href;
                name = name.replace(/[\[\]]/g, "\\$&");
                var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                    results = regex.exec(url);
                if (!results) return null;
                if (!results[2]) return '';
                return decodeURIComponent(results[2].replace(/\+/g, " "));
            }
        },
        setWindowTitle: function () {
            let title1 = document.querySelector('.backInfoTxt1');
            let title2 = document.querySelector('.backInfoTxt2');
            let title3 = document.querySelector('.backInfoTxt3');

            if(title1 && title2 && title3){
                document.title = title1.innerText + " " + title2.innerText + " " + title3.innerText;
            }
        },
        getFooter: function () {
            return document.querySelector('.space');
        },
        getVideo: function () {
            return document.querySelector('video[src*="blob:https://anime.dmkt-sp.jp/"]');
        },
        getSeekBar: function () {
            return document.querySelector('.seekArea');
        },
        getLiveFlag: function () {
            return false;
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
            footer.insertAdjacentHTML('afterbegin', '<input type="button" id="' + SPEED_UP_ID + '" value=">" class="mainButton" style="color:#a0a09f;vertical-align:top;font-size:250%;margin-left: 2px;margin-right: 12px;padding-right:5px;padding-left:2px;">');
            footer.insertAdjacentHTML('afterbegin', '<span class="mainButton" id="' + SPEED_SPAN_ID + '" style="color:#a0a09f;top:8px;vertical-align:middle;font-size:140%;margin-left: 5px;padding-left:0px;"></span>');
            footer.insertAdjacentHTML('afterbegin', '<input type="button" id="' + SPEED_DOWN_ID + '" value="<"  class="mainButton" style="color:#a0a09f;vertical-align:top;font-size:250%;margin-left: 12px;padding-right:2px;padding-left:10px;">');

            footer.insertAdjacentHTML('afterbegin', '<input type="button" id="' + TIME_ADVANCE_ID + '" value=">>" class="mainButton" style="color:#a0a09f;vertical-align:top;font-size:200%;margin-left: 10px;padding-right:10px;padding-left:5px;">');
            footer.insertAdjacentHTML('afterbegin', '<input type="button" id="' + TIME_BACK_ID + '" value="<<" class="mainButton" style="color:#a0a09f;vertical-align:top;font-size:200%;margin-left: 12px;padding-right:5px;padding-left:10px;">');
        },
        /* 音量バーを設定する */
        setVolumeBar: function (volume) {
            return;
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
            site.setVideoLink();

            if (!footer || !video || !seekBar) {
                window.setTimeout(function () {
                    //console.log(SCRIPT_NAME, 'initialize timeout...');
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
                site.setWindowTitle();
            }, 1000);
        },
    };
    core.initialize();
})();