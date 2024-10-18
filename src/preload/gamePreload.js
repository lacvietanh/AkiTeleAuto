import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
const fs = require('fs');
const path = require('path')
const cheerio = require('cheerio');

let wdType = process.argv.filter(arg => arg.startsWith('--akiWindowType='))[0]
  .split('=')[1] // loginWindow || gameWindow
let gameId = process.argv.filter(arg => arg.startsWith('--akiGameId='))[0]
  .split('=')[1]
let forceMode = process.argv.filter(arg => arg.startsWith('--akiForceMode='))[0]
  .split('=')[1] // external | tgweb | tgapp | undefined

console.log('forceMode:', forceMode, 'gameId:', gameId);

// --- GLOBAL FUNCTION ---
window.$id = (id) => document.getElementById(id)
window.$qs = (s) => document.querySelector(s)
window.$qsa = (s) => document.querySelectorAll(s)
window.mainLog = function (s, hereLog = 0) {
  ipcRenderer.send('log', s)
  if (hereLog == 1) console.log(s);
}
window.loadURLbyMain = (url) => api.ipcAction('loadURL', { url: url })

const selectEleToDo = function (selector, action = (e) => e.click(),
  interval = 300, timeout = 30000) {
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

  injectAndroid: async (injectAndroid = true) => {
    let iframe = document.querySelector('iframe.payment-verification') || null
    if (iframe) {
      if (injectAndroid) {
        iframe.src = iframe.src.replace('Platform=web&', 'Platform=android&')
        await new Promise(resolve => setTimeout(resolve, 999));
        // alert('inject Done! Please reload iframe..')
        // need find "reload" minigame button for click
      }
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
});


function getLoginUserInfo() {
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
}
function addAkiGamePanel() {
  // file after build: /out/preload/gamePanel.html
  const gamePanelFile = path.join(__dirname, 'gamePanel.html')
  let gamePanelHtml = fs.readFileSync(gamePanelFile)
  const $ = cheerio.load(gamePanelHtml);
  window.addEventListener("DOMContentLoaded", () => {
    // CREATE PANEL:
    const panel = document.createElement('div');
    panel.className = 'AkiTITLEBAR';
    panel.innerHTML = $('div.AkiTITLEBAR').html();
    document.body.appendChild(panel);

    const panelStyle = document.createElement('style');
    panelStyle.innerHTML = $('style[name=AkiPanel]').html();
    document.body.appendChild(panelStyle);

    const BulmaOptimized = document.createElement('style');
    BulmaOptimized.innerHTML = $('style[name=BulmaOptimized]').html();
    document.body.appendChild(BulmaOptimized);

    // add vue3 to gamePanel 
    let scriptVue3 = document.createElement('script')
    scriptVue3.src = 'https://unpkg.com/vue@3.2.31/dist/vue.global.js'
    document.body.appendChild(scriptVue3);

    function setTITLEBAR_active(s = true) {
      s === true
        ? $qs('.AkiTITLEBAR')?.classList.add('active')
        : $qs('.AkiTITLEBAR')?.classList.remove('active')
    }
    window.addEventListener('focus', () => setTITLEBAR_active(true));
    window.addEventListener('blur', () => setTITLEBAR_active(false));
    window.addEventListener('click', () => setTITLEBAR_active(true), { once: true });

  }, { once: true })

  // wait vue3 loaded:
  window.addEventListener("load", () => {
    // add script module to gamePanel
    let scriptPanel = document.createElement('script')
    scriptPanel.innerHTML = $('script[type=module]').html();
    document.body.appendChild(scriptPanel);
  }, { once: true })
}

// ------------- START -------------
(async function () {
  // FIRST LOAD 
  if (window.location.host == "t.me") {
    let game = await ipcRenderer.invoke('get-game-data', gameId);
    // mainLog(game.name + ' get data done!', 1);
    if (!game.requireInApp || forceMode != 'tgapp') {
      // mainLog(game.name + ' LOCK protoUrl=null (prevent openTeleApp)', 1);
      Object.defineProperty(window, 'protoUrl', { value: null, configurable: false, writable: false });
    }

    addEventListener("DOMContentLoaded", () => {
      // update bot game Avatar: 
      let avt = $qs('div.tgme_page_photo img').src
      ipcRenderer.send('data', { name: 'gameAvt', data: avt, gameId: gameId })

      if (game.requireInApp || forceMode == 'tgapp') {
        location.href = game.tgAddr
        api.ipcAction('gameWindowLoaded')
        api.ipcAction('closethiswindow')
      } else {
        // Open In Web ---- REQUIRE ALREADY LOGIN ----
        let tgAddr = encodeURIComponent(game.tgAddr)
        let OpenInWebURL = `https://web.telegram.org/k/#?tgaddr=${tgAddr}`
        location.href = OpenInWebURL
      }

      // let sendMessage_Btn = '.tgme_action_button_new.shine'
      // selectEleToDo(sendMessage_Btn, (btn) => {
      // let url = btn.href
      // let tgAddr = encodeURIComponent(url)
      // let OpenInWebURL = `https://web.telegram.org/k/#?tgaddr=${tgAddr}`
      // })

      // sau khi bấm sẽ chuyển tới trang web.telegram.org
      // hoặc chuyển tới tn bot kèm nút launch riêng 
      // window will reload
    })
  } else if (window.location.host == "web.telegram.org") {
    if (wdType == 'loginWindow') {
      getLoginUserInfo()
    } else if (wdType == 'gameWindow') {
      let game = await ipcRenderer.invoke('get-game-data', gameId);
      let LaunchBtnInPopup = '.popup-button.btn.primary.rp'
      let firstIframeGame = 'iframe.payment-verification'
      // some bot need click GO btn in bot chat -> click LAUNCH btn in popup
      if (game.launchBtnInBotChat) selectEleToDo(game.launchBtnInBotChat)
      selectEleToDo(LaunchBtnInPopup)

      selectEleToDo(firstIframeGame, (e) => {
        api.ipcAction('gameWindowLoaded')

        if (!game.requireMiniApp && forceMode != 'tgweb') {
          // redirect to game url (mode: external)
          api.openIFrameURL(game.requireMobile)
        } else { // open as mini app in tele web
          api.injectAndroid(game.requireMobile)
        }
      }, 500, 20000)
    }
  }
})()


addAkiGamePanel()
