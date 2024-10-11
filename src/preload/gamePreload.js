import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

let wdType = process.argv.filter(arg => arg.startsWith('--akiWindowType='))[0]
  .replace('--akiWindowType=', '') // loginWindow || gameWindow
let gameId = process.argv.filter(arg => arg.startsWith('--akiGameId='))[0]
  .replace('--akiGameId=', '')
// alert(`${wdType} with gameId:${gameId}`) // debug


// --- GLOBAL FUNCTION ---
window.$id = (id) => document.getElementById(id)
window.$qs = (s) => document.querySelector(s)
window.$qsa = (s) => document.querySelectorAll(s)
window.mainLog = function (s, hereLog = 0) {
  ipcRenderer.send('log', s)
  if (hereLog == 1) console.log(s);
}
window.loadURLbyMain = (url) => api.ipcAction('loadURL', { url: url })
window.selectEleToDo = function (selector, action = (e) => e.click(),
  interval = 300, timeout = 5000) {
  let startTime = Date.now();
  let timer = setInterval(() => {
    // mainLog('trying in ' + location.host) //Deb
    let element = $qs(selector);
    if (element) {
      clearInterval(timer);
      action(element) // callback with result of selector
    } else if (Date.now() - startTime > timeout) {
      clearInterval(timer);
      console.warn(`Không tìm thấy element ${selector} sau ${timeout}ms.`);
    }
  }, interval);
}


// --- API ---
const api = {
  InspectAtMouse: (x, y) => {
    ipcRenderer.send('action', { name: 'inspect-at', data: { x, y } });
  },

  ipcAction: (actionName, data = {}) => {
    ipcRenderer.send('action', { name: actionName, data: data })
  },

  ipcGet: (dataName) => {
    ipcRenderer.send('get', dataName)
  },

  openIFrameURL: (injectAndroid = true) => {
    let url = document.querySelector('iframe.payment-verification')?.src; // optional chaining
    if (url) {
      if (injectAndroid) url = url.replace('Platform=web&', 'Platform=android&')
      loadURLbyMain(url) // using location.href will lose preload script
    } else {
      alert('Please launch a mini app.');
    }

  },

  injectAndroid: (opt = true) => {
    let iframe = document.querySelector('iframe.payment-verification') || null
    if (iframe) {
      iframe.src = opt
        ? iframe.src.replace('Platform=web&', 'Platform=android&')
        : iframe.src.replace('Platform=android&', 'Platform=macos&')
      alert('inject Done! Please reload iframe..')
      // need find "reload" minigame button for click
    } else {
      alert('Please launch a mini app')
    }
  },

  randomRange: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  autoPointerClick: function (x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const delay = api.randomRange(30, 120);
    api._autoClickInterval = setInterval(() => {
      const target = document.elementFromPoint(x, y);
      const range = 50; // random range
      const xRandom = api.randomRange(x - range, x + range)
      const yRandom = api.randomRange(y - range, y + range)
      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: xRandom, clientY: yRandom }));
      target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: xRandom, clientY: yRandom }));
      target.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, clientX: xRandom, clientY: yRandom }));
    }, delay);
    return delay
  }
}


// ----- EXPOSE -----
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}


// ------ IPC Listen ----
electron.ipcRenderer.on('data', (ev, mess) => {
  mainLog('ipcRenderer received DATA name:' + mess.name + ' : ' + mess.data);
  switch (mess.name) {
    case 'profileDisplayName':
      $qs('#AkiTele_TitleName').innerText = mess.data; break;
    default: console.log(mess.name, ' is not defined')
      break;
  }
});





// ------------- START -------------
; (async function checkGameRequiredEnvironment() {
  // Try Lock protoUrl on t.me before DOM load:
  if (window.location.host == "t.me") {
    let game = await ipcRenderer.invoke('get-game-data', gameId);
    // mainLog(game.name + ' get data done!', 1);
    if (!game.requireInApp) {
      // mainLog(game.name + ' LOCK protoUrl null (prevent openTeleApp)', 1);
      Object.defineProperty(window, 'protoUrl', { value: null, configurable: false, writable: false });
    } else {
      // mainLog(game.name + ' requireInApp: YES! ');
      addEventListener("DOMContentLoaded", () => {
        window.location.href = window.protoUrl // automatic open on telegram app
        // alert('this minigame required In-App play! Please play inside Telegram App');
        api.ipcAction('closethiswindow')
      })
    }
  }
})()

document.addEventListener('mousedown', function (ev) {
  if (!ev.ctrlKey && !ev.altKey && ev.shiftKey && ev.button === 0) {
    // shift + Lclick = AutoClick
    if (api._autoClickInterval == null) {
      let delay = api.autoPointerClick(ev.clientX, ev.clientY)
      let div = document.createElement('div')
      div.id = "aki_autoclickLabel"
      div.innerText = `AUTOCLICK: ${delay}ms`;
      // move for prevent click target itself:
      let X = ev.clientX + 10, Y = ev.clientY + 10;
      div.style = `position:fixed;top:${Y}px;left:${X}px;color: red;text-shadow: yellow 0px 0px 2px;user-select: none;z-index: 9999;font-weight: bold;`;
      document.body.appendChild(div)
    } else {
      $qs('div#aki_autoclickLabel').remove()
      clearInterval(api._autoClickInterval); api._autoClickInterval = null
    }
  } else if (ev.ctrlKey && ev.altKey && !ev.shiftKey) {
    // ctrl + alt + Lclick = InspectElement
    api.InspectAtMouse(ev.clientX, ev.clientY)
  }
});
addEventListener('contextmenu', (ev) => {
  if (ev.shiftKey) {
    history.go(-1)
  }
})


window.addEventListener("DOMContentLoaded", async () => {
  // mainLog('DOMContentLoaded from ' + location.host, 1) // DEB
  let OpenInWeb_Btn = '.tgme_action_button_new.tgme_action_web_button'
  let LaunchBtnInPopup = '.popup-button.btn.primary.rp'
  let firstIframeGame = 'iframe.payment-verification'

  if (window.location.host == "t.me") {
    // nếu đã login sẽ có nút này:
    selectEleToDo(OpenInWeb_Btn, (btn) => {
      // sau khi bấm sẽ chuyển tới trang web.telegram.org
      // hoặc chuyển tới tn bot kèm nút launch riêng 
      let avt = $qs('div.tgme_page_photo img').src
      ipcRenderer.send('data', { name: 'gameAvt', data: avt, gameId: gameId })
      btn.click();
      mainLog('clicked "Open in web"', 1)
      // window will reload
    })
  } else if (window.location.host == "web.telegram.org") {
    if (wdType == 'loginWindow') { // lấy id => username 
      let tryGetId = setInterval(() => {
        let id = localStorage.getItem('user_auth') ? JSON.parse(`${localStorage.user_auth}`).id : 0;
        if (id !== 0) {
          clearInterval(tryGetId)
          location.href = '#' + id
          // try get Tag Name (telegram auto change hash from id to tagName - not dispatch "hashchange" event)
          setTimeout(() => {
            let tagName = '@'
            if (location.hash.charAt(1) == "@") tagName = location.hash.slice(2)
            ipcRenderer.send('data', {
              name: 'profileUser', data: { uid: id, tagName: tagName }
            })
          }, 900)
        }
      }, 1000)
    } else if (wdType == 'gameWindow') {
      selectEleToDo(LaunchBtnInPopup, (b) => { b.click(); mainLog('clicked "Launch"', 1) })
      selectEleToDo(firstIframeGame, async (e) => {
        let game = await ipcRenderer.invoke('get-game-data', gameId);
        if (!game.requireMiniApp) {
          mainLog(game.name + ' requireMiniApp: NONE! ' + game.requireMiniApp, 1);
          api.openIFrameURL(game.requireMobile)
        } else {
          // alert('Game yêu cầu chơi trong miniapp:', game.requireMiniApp);
          // ... (Xử lý logic khi game yêu cầu chơi trong miniapp)
          // Khả năng cần Selenium
        }
      }, 500, 20000)

    }
  }

})
// CREATE PANEL:
window.addEventListener("DOMContentLoaded", () => {
  const panel = document.createElement('div');
  panel.className = 'AkiTITLEBAR';
  panel.innerHTML = /*html*/`
    <style>
      .AkiTITLEBAR.active {
        background-color: #222;
      }
      .AkiTITLEBAR {
        font-family:Inter,SF Pro,Segoe UI,Roboto,Oxygen,Ubuntu,Helvetica Neue,Helvetica,Arial,sans-serif;
        font-size:0.8em;
        border-radius:;
        user-select: none;
        -webkit-app-region: drag; 
        position: fixed;
        left: 0;
        right:0;
        top:0;
        height:20px;
        z-index: 9999;
        background-color: #2229;
        display:flex;
        justify-content: space-between;
        color: #fff;
        text-shadow: 0px 0px 3px #000;
        backdrop-filter: blur(2px);
        transition: all 0.2s;
      }
      .AkiTITLEBAR button {
        app-region: none;
        cursor: pointer;
        padding: 0 5px;
        border-radius: 5px;
        background: #488182;
        color: #fff;
        transition: 0.4s;
      }
      .AkiTITLEBAR button:hover {
        box-shadow: 0px 0px 5px 4px rgb(255 255 255 / 49%);
      }
      .trafficLight {
        margin-top: 3px;
        margin-left: 7px;
      }
      .AkiTITLEBAR.active .trafficLight button {
        opacity: 1;
      }
      .trafficLight button {
        border-radius: 100%;
        padding: 0;
        height: 12px;
        width: 12px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-sizing: border-box;
        margin-right: 3.5px;
        background-color: #ddd;
        position: relative;
        outline: none;
        opacity: 0.5;
      }
      .trafficLight .close {background-color: #ff6159;}
      .trafficLight .min {background-color: #ffbd2e;}
      .trafficLight .max {background-color: #28c941;}
      .AkiTITLEBAR.active .trafficLight button .close {background-color: #ff5f57;}
      .AkiTITLEBAR.active .trafficLight button .min {background-color: #febc2e;}

      #AkiTele_TitleName{padding: 1px 3px;}
      body{
        margin-top:20px !important;
      }
    </style>
    <div class="trafficLight">
      <button class="close" title="CLOSE" onclick="api.ipcAction('closethiswindow')">&nbsp;</button>
      <button class="min"   title="Minimize" onclick="api.ipcAction('minizethiswindow')">&nbsp;</button>
      <button class="max"   title="Maximize is disabled" disabled>&nbsp;</button>
    </div>
    <div id="AkiTele_Tools">
      <button title="Go Back" onclick="history.go(-1);"><</button>
      <button title="Go Forward" onclick="history.go(1);">></button>
    </div>
    <div id="AkiTele_TitleName"></div>
  `;
  document.body.appendChild(panel);

  function setTITLEBAR_active(s = true) {
    s === true
      ? $qs('.AkiTITLEBAR')?.classList.add('active')
      : $qs('.AkiTITLEBAR')?.classList.remove('active')
  }
  window.addEventListener('focus', () => setTITLEBAR_active(true));
  window.addEventListener('blur', () => setTITLEBAR_active(false));

}, { once: true })
