// --- 1. IMPORT ---
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

let wdType = process.argv.filter(arg => arg.startsWith('--akiWindowType='))[0]
  .replace('--akiWindowType=', '') // loginWindow || gameWindow

let gameId = process.argv.filter(arg => arg.startsWith('--akiGameId='))[0]
  .replace('--akiGameId=', '')
// alert(`${wdType} with gameId:${gameId}`) // debug


// --- 2. UTILITY FUNCTIONS ---
window.$id = (id) => { return document.getElementById(id) }
window.$qs = (s) => { return document.querySelector(s) }
window.$qsa = (s) => { return document.querySelectorAll(s) }
window.mainLog = (s, hereLog = 0) => {
  ipcRenderer.send('log', s)
  if (hereLog == 1) console.log(s);
}
// --- 3. CORE FUNCTIONS (async) ---

async function initGame() {
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
if (window.location.host == "t.me") initGame() // first load



window.addEventListener("DOMContentLoaded", () => {

  // lấy id => username 
  if (window.location.host == "web.telegram.org" && wdType == 'loginWindow') {
    let tryGetId = setInterval(() => {
      let id = localStorage.getItem('user_auth') ? JSON.parse(`${localStorage.user_auth}`).id : 0;
      if (id !== 0) {
        clearInterval(tryGetId)
        location.href = '#' + id
        TimeOutTryGetTagName = setTimeout(() => {
          let tagName = '@'
          if (location.hash.charAt(1) == "@") tagName = location.hash.slice(2)
          ipcRenderer.send('data', {
            name: 'profileUser', data: { uid: id, tagName: tagName }
          })
        }, 900)
      }
    }, 1000)
  }

  // mainLog('DOMContentLoaded from ' + location.host, 1) // DEB
  waitElementforAction('.tgme_action_button_new.tgme_action_web_button', (btn) => {
    // ở trang t.me sẽ có nút này, sau khi bấm sẽ chuyển tới trang web.telegram.org
    btn.click();
    mainLog('clicked "Open in web"', 1)
  });
  waitElementforAction('.popup-button.btn.primary.rp', (btn) => {
    // lúc này đang chuyển tới web.telegram.org kèm popup "launch"
    btn.click();
    mainLog('clicked "Launch"', 1)
  });

  waitElementforAction('iframe.payment-verification', async (e) => {
    let game = await ipcRenderer.invoke('get-game-data', gameId);
    if (!game.requireMiniApp) {
      mainLog(game.name + ' requireMiniApp: NONE! ' + game.requireMiniApp, 1);
      api.openIFrameURL(game.requireMobile)
    } else {
      // alert('Game yêu cầu chơi trong miniapp:', game.requireMiniApp);
      // ... (Xử lý logic khi game yêu cầu chơi trong miniapp)
      // Khả năng cần Selenium
    }
  }, 500, 25000)
})


// --- 4. HELPER FUNCTIONS ---
const waitElementforAction = window.waitElementforAction = (
  selector, action = (e) => e.click(),
  interval = 300, timeout = 5000) => {
  let startTime = Date.now();
  let timer = setInterval(() => {
    // mainLog('trying in ' + location.host) //Deb
    let element = document.querySelector(selector);
    if (element) {
      clearInterval(timer);
      action(element); // Gọi hàm action với element tìm được
    } else if (Date.now() - startTime > timeout) {
      clearInterval(timer);
      console.warn(`Không tìm thấy element ${selector} sau ${timeout}ms.`);
    }
  }, interval);
};

window.loadURLbyMain = (url) => {
  api.ipcAction('loadURL', { url: url })
}

// --- 5. API EXPOSED TO RENDERER ---
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
      loadURLbyMain(url)
    } else {
      alert('Please launch a mini app.');
    }

  },
  injectAndroid: () => {
    let iframe = document.querySelector('iframe.payment-verification') || null
    if (iframe) {
      iframe.src = iframe.src.replace('Platform=web&', 'Platform=android&')
      // need find "reload" minigame button for click
    } else {
      alert('Please launch a mini app')
    }
  },
  randomRange: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  autoPointerClick: (x = window.innerWidth / 2, y = window.innerHeight / 2) => {
    api._autoClickInterval = setInterval(() => {
      const target = document.elementFromPoint(x, y);
      const range = 50; // random range
      const xRandom = api.randomRange(x - range, x + range)
      const yRandom = api.randomRange(y - range, y + range)
      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: xRandom, clientY: yRandom }));
      target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: xRandom, clientY: yRandom }));
      target.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, clientX: xRandom, clientY: yRandom }));
    }, api.randomRange(30, 150));
  }
}


document.addEventListener('mousedown', function (ev) {
  if (ev.shiftKey && ev.button === 0) {
    // Thực hiện hành động khi nhấn Shift + Chuột trái
    if (api._autoClickInterval == null) {
      let div = document.createElement('div')
      div.id = "aki_autoclickLabel"
      div.innerText = "AUTOCLICK: ON";
      // move for prevent click target itself:
      let X = ev.clientX + 10, Y = ev.clientY + 10;
      div.style = `position:fixed;top:${Y}px;left:${X}px;color: red;text-shadow: yellow 0px 0px 2px;user-select: none;z-index: 999;font-weight: bold;`;
      document.body.appendChild(div)
      api.autoPointerClick(ev.clientX, ev.clientY)
    } else {
      $qs('div#aki_autoclickLabel').remove()
      clearInterval(api._autoClickInterval); api._autoClickInterval = null
    }
  }
});
addEventListener('contextmenu', (ev) => {
  if (ev.altKey) {
    api.InspectAtMouse(ev.clientX, ev.clientY);
  } else if (ev.shiftKey) {
    history.go(-1)
  }
})

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


window.addEventListener("load", () => {
  // if (window.location.host == "web.telegram.org") {
  //   let id = localStorage.getItem('user_auth') ? JSON.parse(`${localStorage.user_auth}`).id : ''
  //   alert('id: ' + id)
  // }
})