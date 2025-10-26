"use strict";

let VIDEO_SPEED;
let TEMP_VIDEO_SPEED;
let TIME_WIDTH;
let TIME_WHEEL_WIDTH;
let SPEED_WIDTH;
let VOLUME_WIDTH;
let INITIALIZE_TIMER;

let NUM_KEY_FLAG;

VIDEO_SPEED = 1.00;
TEMP_VIDEO_SPEED = 1.00;
TIME_WIDTH = 5;
TIME_WHEEL_WIDTH = 1;
SPEED_WIDTH = 0.05;
VOLUME_WIDTH = 0.022;
INITIALIZE_TIMER = 300;

let CACHE_NAME, RESUME_CACHE_NAME, RESUME_CACHE, SPEED_CACHE_NAME;
let SITE_CONFIG;

const RESUME_CACHE_NAME_PRE = "ResumeTime_"
const SPEED_CACHE_NAME_PRE = "VideoSpeed_"

const NOW = Date.now();

const SCRIPT_NAME = 'VideoController';
const FOOTER_VIDEO_EXPANSION_CONTROLLER = 'vec_';
const SPEED_UP_ID = FOOTER_VIDEO_EXPANSION_CONTROLLER + 'speed_up';
const SPEED_SPAN_ID = FOOTER_VIDEO_EXPANSION_CONTROLLER + 'speed_span';
const SPEED_DOWN_ID = FOOTER_VIDEO_EXPANSION_CONTROLLER + 'speed_down';
const TIME_ADVANCE_ID = FOOTER_VIDEO_EXPANSION_CONTROLLER + 'time_advance';
const TIME_BACK_ID = FOOTER_VIDEO_EXPANSION_CONTROLLER + 'time_back';

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


    if (keyEvent) {
        document.body.removeEventListener('keydown', keyEvent);
    }

}

/* キャッシュ読み込み */
async function readCache() {
    // if (localStorage.getItem(CACHE_NAME)) {
    //     VIDEO_SPEED = Number(localStorage.getItem(CACHE_NAME));
    // }
    chrome.storage.local.get(SPEED_CACHE_NAME, (data) => {
        VIDEO_SPEED = data[SPEED_CACHE_NAME] || 1;
    });
}

/* レジュームキャッシュ読み込み */
async function readResumeCache() {
    if (!SITE_CONFIG.resume) return;
    // console.log("readResumeCache")
    RESUME_CACHE = await getVideoData();
    if (!site.getLiveFlag()) {
        window.setTimeout(function () {
            const time = Number(RESUME_CACHE.playback_time);
            if (Number.isFinite(time) && time >= 0) {
                video.currentTime = Number(RESUME_CACHE.playback_time);
            }
        }, 1000);
    }
}

/* キャッシュセーブ */
async function saveCache() {
    // if (!site.getLiveFlag()) {
    //     localStorage.setItem(CACHE_NAME, VIDEO_SPEED);
    // }
    if (!site.getLiveFlag()) {
        VIDEO_SPEED = Number(VIDEO_SPEED.toFixed(2));
        chrome.storage.local.set({ [SPEED_CACHE_NAME]: VIDEO_SPEED }, () => {
            resolve();
        });
    }
}

/* レジュームキャッシュセーブ */
function saveResumeCache() {
    // console.log("saveResumeCache")
    if (!SITE_CONFIG.resume) return;
    if (resumeTime) {
        let timeDiff = Math.abs(video.currentTime - resumeTime);
        if (!timeDiff || timeDiff < 5) return;
        resumeTime = video.currentTime;
    } else {
        resumeTime = video.currentTime;
        return;
    }
    if (!RESUME_CACHE_NAME || video.paused) return;
    if (!site.getLiveFlag()) {
        if (video.currentTime < 120 || video.currentTime > video.duration - 120) {
            (async () => {
                const deleted = await deleteVideoData();
            })();
        } else {
            resumeTime = video.currentTime - 2;
            (async () => {
                await saveVideoData();
            })();
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

    if (SITE_CONFIG && SITE_CONFIG.seek_button) {
        timeBackButton.onclick = function () {
            setCurrentTime(-TIME_WIDTH);
            this.blur();
        };
        timeAdvanceButton.onclick = function () {
            setCurrentTime(TIME_WIDTH);
            this.blur();
        };
        setHold(timeBackButton);
        setHold(timeAdvanceButton);
    }

    if (SITE_CONFIG && SITE_CONFIG.speed_button) {
        speedDownButton.onclick = function () {
            VIDEO_SPEED = setPlaybackRate(-SPEED_WIDTH);
            this.blur();
        };
        speedUpButton.onclick = function () {
            VIDEO_SPEED = setPlaybackRate(SPEED_WIDTH);
            this.blur();
        };

        setHold(speedDownButton);
        setHold(speedUpButton);
    }
    speedSpanButton.onclick = function () {
        video.playbackRate = 1.00;
        VIDEO_SPEED = video.playbackRate;
        showVideoSpeed();
        saveCache();
        this.blur();
    };

    setHoldCanvas(site.getCanvas());

    /* マウスホールドイベントを登録する */
    function setHold(target) {
        let pushing_flag = 0;
        let timerId;

        target.addEventListener('mousedown', e => {
            e.stopPropagation();
            pushing_flag = 1;
            timerId = window.setTimeout(mouseHold, 500, e.currentTarget);
        });
        target.addEventListener('mouseup', e => {
            e.stopPropagation();
            pushing_flag = 0;
            window.clearTimeout(timerId);
        });
        target.addEventListener('mouseout', e => {
            e.stopPropagation();
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

/* マウスホールドキャンバスイベントを登録する */
function setHoldCanvas(target) {
    let pushing_flag = 0;
    let holding_flag = 0;
    let singleClickFlag = false;
    let holdTimerId;
    let clickTimerId;
    let videoPausedFlag;

    target.addEventListener('mousedown', e => {
        videoPausedFlag = undefined;
        TEMP_VIDEO_SPEED = VIDEO_SPEED;
        pushing_flag = 1;
        holdTimerId = window.setTimeout(mouseHold, 250, e.currentTarget);
    });
    target.addEventListener('mouseup', e => {
        singleClickFlag = !singleClickFlag;
        if (singleClickFlag && !holding_flag) {
            singleClickFlag = true;
            clickTimerId = window.setTimeout(singleClick, 250, e);
        } else if (!singleClickFlag && !holding_flag) {
            window.clearTimeout(clickTimerId);
            singleClickFlag = false;
            site.doubleClick(e);
        } else if (holding_flag) {
            singleClickFlag = false;
        }
        pushing_flag = 0;
        holding_flag = 0;
        VIDEO_SPEED = TEMP_VIDEO_SPEED;
        video.playbackRate = VIDEO_SPEED;
        window.setTimeout(ChangeVideoPaused, 5, site.getVideo());
        window.clearTimeout(holdTimerId);
    });
    target.addEventListener('mouseout', e => {
        if (pushing_flag) {
            VIDEO_SPEED = TEMP_VIDEO_SPEED;
            video.playbackRate = VIDEO_SPEED;
        }
        pushing_flag = 0;
        holding_flag = 0;
        singleClickFlag = false;
        window.clearTimeout(holdTimerId);
    });
    function singleClick(e) {
        singleClickFlag = false;
        site.singleClick(e);
    }
    function mouseHold(video) {
        if (pushing_flag) {
            holding_flag = 1;
            videoPausedFlag = site.getVideo().paused;
            singleClickFlag = false;
            VIDEO_SPEED = TEMP_VIDEO_SPEED * 2;
            video.playbackRate = TEMP_VIDEO_SPEED;
            window.clearTimeout(clickTimerId);
            holdTimerId = window.setTimeout(mouseHold, 100, video);
        }
    }
    function ChangeVideoPaused(video) {
        if (videoPausedFlag === undefined) return;
        videoPausedFlag ? video.pause() : video.play();
    }
}

/* イベント設定 */
function setEvent() {

    let speedButtons = document.querySelectorAll('[id^="' + FOOTER_VIDEO_EXPANSION_CONTROLLER + 'speed_"]');
    let seekButtons = document.querySelectorAll('[id^="' + FOOTER_VIDEO_EXPANSION_CONTROLLER + 'time_"]');

    document.body.addEventListener('keydown', keyEvent);

    /* マウスオーバシークボタン */
    seekButtons.forEach(function (element) {

        element.addEventListener("mouseover", function () {
            document.addEventListener('wheel', mouseOverFooter, {
                passive: false,
                capture: true

            });
        });
        element.addEventListener("mouseout", function () {
            document.removeEventListener('wheel', mouseOverFooter, {
                passive: false,
                capture: true
            });
        });
    });

    /* マウスオーバスピードボタン */
    speedButtons.forEach(function (element) {

        element.addEventListener("mouseover", function () {
            document.addEventListener('wheel', mouseOverSpeedButton, {
                passive: false,
                capture: true
            });
        });
        element.addEventListener("mouseout", function () {
            document.removeEventListener('wheel', mouseOverSpeedButton, {
                passive: false,
                capture: true
            });
        });
    });

    /* マウスオーバシークバー */
    if (seekBar) {
        seekBar.addEventListener("mouseover", function () {
            document.addEventListener('wheel', mouseOverSeeekBar, {
                passive: false,
                capture: true
            });
        });
        seekBar.addEventListener("mouseout", function () {
            document.removeEventListener('wheel', mouseOverSeeekBar, {
                passive: false,
                capture: true
            });
        });
    }

    /* マウスオーバシークバー */
    function mouseOverSeeekBar(event) {
        event.preventDefault();
        event.stopPropagation();
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
        event.stopPropagation();
        let volume;
        if (event.wheelDelta > 0) {
            volume = setVolume(VOLUME_WIDTH);
        } else {
            volume = setVolume(-VOLUME_WIDTH);
        }
        site.setVolumeBar(volume);
    }

    /* マウスオーバスピードボタン */
    function mouseOverSpeedButton(event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.wheelDelta > 0) {
            setPlaybackRate(SPEED_WIDTH);
        } else {
            setPlaybackRate(-SPEED_WIDTH);
        }

    }
}

let keyEvent = (event) => {
    const activeEl = document.activeElement;

    // フォーカス中の要素のタイプ判定
    const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
    const isContentEditable = activeEl.isContentEditable;

    if (isInput || isContentEditable) {
        // 入力中なのでキー処理は無効にする
        return;
    }
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
    const doc = document.querySelector('#' + SPEED_SPAN_ID);
    if (doc) doc.innerText = VIDEO_SPEED.toFixed(2);
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
    video.defaultPlaybackRate = rate;
    VIDEO_SPEED = rate;
    saveCache();
    showVideoSpeed();
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

const defaultConfig = {
    youtube: {
        seek_button: true,
        speed_button: true,
        resume: false
    },
    niconico: {
        seek_button: true,
        speed_button: true,
        resume: true
    },
    amazon: {
        seek_button: true,
        speed_button: true,
        // resume: false
    },
    twitch: {
        seek_button: true,
        speed_button: true,
        // resume: false
    },
    tver: {
        seek_button: true,
        speed_button: true
        //resume: false
    }
};

async function getConfig() {
    const result = await chrome.storage.sync.get('config');
    SITE_CONFIG = result?.config?.[CACHE_NAME] || defaultConfig[CACHE_NAME];
}

async function getVideoData() {
    // console.log("キャッシュアクセス", RESUME_CACHE_NAME);
    return new Promise((resolve) => {
        chrome.storage.local.get(RESUME_CACHE_NAME, (data) => {
            const cache = data[RESUME_CACHE_NAME] || {};
            RESUME_CACHE = cache;
            resolve(cache);
        });
    });
}

const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30; // 約30日
async function cleanOldData() {
  const now = Date.now();
  const prefix = RESUME_CACHE_NAME_PRE + CACHE_NAME;

  // すべてのデータを取得
  const allData = await chrome.storage.local.get(null);

  // 対象データをフィルタ（キーが prefix に一致するもの）
  const targetEntries = Object.entries(allData).filter(([key]) =>
    key.startsWith(prefix)
  );

  const keysToDelete = [];

  for (const [key, value] of targetEntries) {
    // データが正しい形式か確認
    if (!value || typeof value.saved_at !== "number") continue;

    // 1か月以上経過したものを削除対象に
    if (now - value.saved_at > ONE_MONTH_MS) {
      keysToDelete.push(key);
    }
  }

  // 古いデータを削除
  if (keysToDelete.length > 0) {
    await chrome.storage.local.remove(keysToDelete);
    console.log(`削除完了: ${keysToDelete.length} 件`);
  } else {
    console.log("削除対象データなし");
  }

  console.log("クリーンアップ完了");
}


/**
 * サイト名を指定して、再生時間などのデータを保存する
 * @param {string} siteName - 例: 'youtube'
 * @param {object} data - 保存するデータ（id, playback_time など）
 *                        例: { id: 'XXXX', playback_time: 12345 }
 * @returns {Promise<void>}
 */
async function saveVideoData() {
    // console.log("キャッシュ保存", RESUME_CACHE_NAME);
    RESUME_CACHE = {
        playback_time: video.currentTime,
        saved_at: NOW
    };
    return new Promise((resolve) => {
        chrome.storage.local.set({ [RESUME_CACHE_NAME]: RESUME_CACHE }, () => {
            resolve();
        });
    });
}

async function deleteVideoData() {
    chrome.storage.local.remove(RESUME_CACHE_NAME);
    // console.log("キャッシュデータ削除", RESUME_CACHE_NAME);
}

function initializeVideoData() {
    resumeTime = null;
    // console.log("initializeVideoData");
    site.setResumeCacheName();
    RESUME_CACHE = getVideoData();
    cleanOldData();
}