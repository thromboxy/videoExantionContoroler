document.getElementById('open-options').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    // 標準APIでオプションページを開く
    chrome.runtime.openOptionsPage();
  } else {
    // 古いバージョンのChrome用
    window.open(chrome.runtime.getURL('options.html'));
  }
});
