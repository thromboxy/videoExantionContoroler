"use strict";

let VIDEO_SPEED;
let TIME_WIDTH;
let TIME_WHEEL_WIDTH;
let SPEED_WIDTH;
let VOLUME_WIDTH;

let NUM_KEY_FLAG;

VIDEO_SPEED = 1.00;
TIME_WIDTH = 5;
TIME_WHEEL_WIDTH = 1;
SPEED_WIDTH = 0.05;
VOLUME_WIDTH = 0.022;

let CACHE_NAME, RESUME_CACHE_NAME;

const SCRIPT_NAME = 'VideoController';
const SPEED_UP_ID = 'speed_up';
const SPEED_SPAN_ID = 'speed_span';
const SPEED_DOWN_ID = 'speed_down';
const TIME_ADVANCE_ID = 'time_advance';
const TIME_BACK_ID = 'time_back';

// AMAZON用
const SKIP_CHECKBOX_ID = 'skip_checkbox';
const SKIP_CHECKBOX_LABEL = 'skip_checkbox_label';

let site, core, footer, video, videoSrc, videoSrcOld, interval, seekBar, liveFlag, resumeTime;
let url = location.href;
let urlOld;

/* CSS定義 */
let insertStyle = '#' + SPEED_UP_ID + ', #' + SPEED_SPAN_ID + ', #' + SPEED_DOWN_ID + ', #' + TIME_ADVANCE_ID + ', #' + TIME_BACK_ID + ' { color:#fff;cursor: pointer;border:none;outline:none;background:transparent;}';
var style = document.createElement('style');
document.head.appendChild(style);
var sheet = style.sheet;
sheet.insertRule(insertStyle, 0);

/* ボタンを削除 */
function removeBottun() {

    /* 動画シークボタン */
    let timeBackButton = document.querySelector('#' + TIME_BACK_ID);
    let timeAdvanceButton = document.querySelector('#' + TIME_ADVANCE_ID)
    /* 速度変更ボタン */
    let speedDownButton = document.querySelector('#' + SPEED_DOWN_ID);
    let speedSpanButton = document.querySelector('#' + SPEED_SPAN_ID);
    let speedUpButton = document.querySelector('#' + SPEED_UP_ID);

    /* 広告ｽｷｯﾌﾟラベル*/
    let adSkipLabel = document.querySelector('#' + SKIP_CHECKBOX_LABEL);

    if (timeBackButton) { timeBackButton.remove(); }
    if (timeAdvanceButton) { timeAdvanceButton.remove(); }
    if (speedDownButton) { speedDownButton.remove(); }
    if (speedSpanButton) { speedSpanButton.remove(); }
    if (speedUpButton) { speedUpButton.remove(); }
    if (adSkipLabel) { adSkipLabel.remove(); }

    
    if(keyEvent){
        document.body.removeEventListener('keydown', keyEvent);
    }
    
}

/* キャッシュ読み込み */
function readCache() {
    if (localStorage.getItem(CACHE_NAME)) {
        VIDEO_SPEED = Number(localStorage.getItem(CACHE_NAME));
    }

}

/* レジュームキャッシュ読み込み */
function readResumeCache() {
    if (!RESUME_CACHE_NAME) return;
    if (!site.getLiveFlag() && localStorage.getItem(RESUME_CACHE_NAME)) {
        resumeTime = Number(localStorage.getItem(RESUME_CACHE_NAME));
        window.setTimeout(function () {
            video.currentTime = resumeTime;
        }, 500);
    }
}

/* キャッシュセーブ */
function saveCache() {
    if (!site.getLiveFlag()) {
        localStorage.setItem(CACHE_NAME, VIDEO_SPEED);
    }
}

/* レジュームキャッシュセーブ */
function saveResumeCache() {
    if (!RESUME_CACHE_NAME || video.paused) return;
    if (!site.getLiveFlag()) {
        if (video.currentTime < 5 || video.currentTime > video.duration - 10) {
            localStorage.removeItem(RESUME_CACHE_NAME);
        } else {
            localStorage.setItem(RESUME_CACHE_NAME, video.currentTime - 2);
        }
    }
}

/* onClick設定*/
function setOnClick() {
    /* 動画シークボタン */
    let timeBackButton = document.querySelector('#' + TIME_BACK_ID);
    let timeAdvanceButton = document.querySelector('#' + TIME_ADVANCE_ID)
    /* 速度変更ボタン */
    let speedDownButton = document.querySelector('#' + SPEED_DOWN_ID);
    let speedSpanButton = document.querySelector('#' + SPEED_SPAN_ID);
    let speedUpButton = document.querySelector('#' + SPEED_UP_ID);

    timeBackButton.onclick = function () {
        setCurrentTime(-TIME_WIDTH);
        this.blur();
    };
    timeAdvanceButton.onclick = function () {
        setCurrentTime(TIME_WIDTH);
        this.blur();
    };
    speedDownButton.onclick = function () {
        VIDEO_SPEED = setPlaybackRate(-SPEED_WIDTH);
        showVideoSpeed();
        saveCache();
        this.blur();
    };
    speedSpanButton.onclick = function () {
        video.playbackRate = 1.00;
        VIDEO_SPEED = video.playbackRate;
        showVideoSpeed();
        saveCache();
        this.blur();
    };
    speedUpButton.onclick = function () {
        VIDEO_SPEED = setPlaybackRate(SPEED_WIDTH);
        showVideoSpeed();
        saveCache();
        this.blur();
    };

    setHold(timeBackButton);
    setHold(timeAdvanceButton);
    setHold(speedDownButton);
    setHold(speedUpButton);

    /* マウスホールドイベントを登録する */
    function setHold(target) {
        let pushing_flag = 0;
        let timerId;

        target.addEventListener('mousedown', e => {
            pushing_flag = 1;
            timerId = window.setTimeout(mouseHold, 500, e.currentTarget);
        });
        target.addEventListener('mouseup', e => {
            pushing_flag = 0;
            window.clearTimeout(timerId);
        });
        target.addEventListener('mouseout', e => {
            pushing_flag = 0;
            window.clearTimeout(timerId);
        });
        function mouseHold(button) {
            if (pushing_flag) {
                button.onclick();
                timerId = window.setTimeout(mouseHold, 100, button);
            }
        }
    }
}

/* イベント設定 */
function setEvent() {

    document.body.addEventListener('keydown', keyEvent);
    /* キーバインド設定 */
    // document.body.addEventListener('keydown', event => {
    //     if (event.key === 'a') {
    //         document.querySelector('#' + SPEED_DOWN_ID).onclick();
    //     } else if (event.key === 's') {
    //         document.querySelector('#' + SPEED_SPAN_ID).onclick();
    //     } else if (event.key === 'd') {
    //         document.querySelector('#' + SPEED_UP_ID).onclick();
    //     } else if (event.key === 'z') {
    //         document.querySelector('#' + TIME_BACK_ID).onclick();
    //     } else if (event.key === 'x') {
    //         document.querySelector('#' + TIME_ADVANCE_ID).onclick();
    //     } else if (event.key === '0' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         setCurrentTime(0.1 - video.currentTime);
    //     } else if (event.key === '1' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 1) - video.currentTime);
    //     } else if (event.key === '2' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 2) - video.currentTime);
    //     } else if (event.key === '3' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 3) - video.currentTime);
    //     } else if (event.key === '4' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 4) - video.currentTime);
    //     } else if (event.key === '5' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 5) - video.currentTime);
    //     } else if (event.key === '6' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 6) - video.currentTime);
    //     } else if (event.key === '7' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 7) - video.currentTime);
    //     } else if (event.key === '8' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 8) - video.currentTime);
    //     } else if (event.key === '9' && NUM_KEY_FLAG && !site.getLiveFlag()) {
    //         let videoTimeDiv = video.duration / 10;
    //         setCurrentTime((videoTimeDiv * 9) - video.currentTime);
    //     }
        
    // });


    /* マウスオーバフッター */

    footer.addEventListener("mouseover", function () {
        document.addEventListener('wheel', mouseOverFooter, {
            passive: false
        });
    });
    footer.addEventListener("mouseout", function () {
        document.removeEventListener('wheel', mouseOverFooter, {
            passive: false
        });
    });

    /* マウスオーバシークバー */
    if (seekBar) {
        seekBar.addEventListener("mouseover", function () {
            document.addEventListener('wheel', mouseOverSeeekBar, {
                passive: false
            });
        });
        seekBar.addEventListener("mouseout", function () {
            document.removeEventListener('wheel', mouseOverSeeekBar, {
                passive: false
            });
        });
    }

    /* マウスオーバシークバー */
    function mouseOverSeeekBar(event) {
        event.preventDefault();
        let time = video.currentTime;
        if (event.wheelDelta > 0) {
            setCurrentTime(TIME_WHEEL_WIDTH);
        } else {
            setCurrentTime(-TIME_WHEEL_WIDTH);
        }
    }

    /* マウスオーバフッター */
    function mouseOverFooter(event) {
        event.preventDefault();
        let volume;
        if (event.wheelDelta > 0) {
            volume = setVolume(VOLUME_WIDTH);
        } else {
            volume = setVolume(-VOLUME_WIDTH);
        }
        site.setVolumeBar(volume);
    }
}

let keyEvent = (event) => {
    if (event.key === 'a') {
        document.querySelector('#' + SPEED_DOWN_ID).onclick();
    } else if (event.key === 's') {
        document.querySelector('#' + SPEED_SPAN_ID).onclick();
    } else if (event.key === 'd') {
        document.querySelector('#' + SPEED_UP_ID).onclick();
    } else if (event.key === 'z') {
        document.querySelector('#' + TIME_BACK_ID).onclick();
    } else if (event.key === 'x') {
        document.querySelector('#' + TIME_ADVANCE_ID).onclick();
    } else if (event.key === '0' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        setCurrentTime(0.1 - video.currentTime);
    } else if (event.key === '1' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 1) - video.currentTime);
    } else if (event.key === '2' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 2) - video.currentTime);
    } else if (event.key === '3' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 3) - video.currentTime);
    } else if (event.key === '4' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 4) - video.currentTime);
    } else if (event.key === '5' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 5) - video.currentTime);
    } else if (event.key === '6' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 6) - video.currentTime);
    } else if (event.key === '7' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 7) - video.currentTime);
    } else if (event.key === '8' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 8) - video.currentTime);
    } else if (event.key === '9' && NUM_KEY_FLAG && !site.getLiveFlag()) {
        let videoTimeDiv = video.duration / 10;
        setCurrentTime((videoTimeDiv * 9) - video.currentTime);
    }
}

/* ビデオスピードを表示する */
function showVideoSpeed() {
    document.querySelector('#' + SPEED_SPAN_ID).innerText = VIDEO_SPEED.toFixed(2);
}

/* 再生位置を設定 */
function setCurrentTime(width) {
    let time = video.currentTime + width;
    if (video.currentTime >= video.duration - 1 && time > video.currentTime) {
        return;
    } else if (time >= video.duration) {
        time = video.duration;
    } else if (time < 0) {
        time = 0;
    }
    video.currentTime = time;
    return time;
}

/* 再生速度を設定 */
function setPlaybackRate(width) {
    let rate = VIDEO_SPEED + width;
    if (rate > 10) {
        rate = 10;
    } else if (rate < 0.1) {
        rate = 0.1;
    }
    video.playbackRate = rate;
    return rate;
}

/* 音量を設定 */
function setVolume(width) {
    let volume = video.volume + width;
    if (volume > 1) {
        volume = 1;
    } else if (volume < 0) {
        volume = 0;
    }
    video.volume = volume;
    return volume;
}