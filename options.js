document.getElementById('save').addEventListener('click', () => {
  const settings = {
    niconico: {
      seek_button: document.getElementById('niconico_seek').checked,
      speed_button: document.getElementById('niconico_speed').checked,
      resume: document.getElementById('niconico_resume').checked
    },
    youtube: {
      seek_button: document.getElementById('youtube_seek').checked,
      speed_button: document.getElementById('youtube_speed').checked,
      resume: document.getElementById('youtube_resume').checked
    },
    amazon: {
      seek_button: document.getElementById('amazon_seek').checked,
      speed_button: document.getElementById('amazon_speed').checked
      // resume: document.getElementById('amazon_resume').checked
    },
    twitch: {
      seek_button: document.getElementById('twitch_seek').checked,
      speed_button: document.getElementById('twitch_speed').checked,
      // resume: document.getElementById('twitch_resume').checked
    },
    tver: {
      seek_button: document.getElementById('tver_seek').checked,
      speed_button: document.getElementById('tver_speed').checked,
      //resume: document.getElementById('tver_resume').checked
    }
  };

  chrome.storage.sync.set({ config: settings }, () => {
    const status = document.getElementById('status');
    status.textContent = '保存しました';
    setTimeout(() => (status.textContent = ''), 1500);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('config', (data) => {
    let settings = data.config || {
      niconico: {
        seek_button: true,
        speed_button: true,
        resume: true
      },
      youtube: {
        seek_button: true,
        speed_button: true,
        resume: false
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

    document.getElementById('niconico_seek').checked = settings.niconico?.seek_button || false;
    document.getElementById('niconico_speed').checked = settings.niconico?.speed_button || false;
    document.getElementById('niconico_resume').checked = settings.niconico?.resume || false;
    document.getElementById('youtube_seek').checked = settings.youtube?.seek_button || false;
    document.getElementById('youtube_speed').checked = settings.youtube?.speed_button || false;
    document.getElementById('youtube_resume').checked = settings.youtube?.resume || false;
    document.getElementById('amazon_seek').checked = settings.amazon?.seek_button || false;
    document.getElementById('amazon_speed').checked = settings.amazon?.speed_button || false;
    // document.getElementById('amazon_resume').checked = settings.amazon?.resume || false;
    document.getElementById('twitch_seek').checked = settings.twitch?.seek_button || false;
    document.getElementById('twitch_speed').checked = settings.twitch?.speed_button || false;
    // document.getElementById('twitch_resume').checked = settings.twitch?.resume || false;
    document.getElementById('tver_seek').checked = settings.tver?.seek_button || false;
    document.getElementById('tver_speed').checked = settings.tver?.speed_button || false;
    //document.getElementById('tver_resume').checked = settings.tver?.resume || false;
  });
});
