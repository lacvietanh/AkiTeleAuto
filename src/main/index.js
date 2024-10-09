import icon from '../../resources/icon.png?asset'
const path = require('path');
const fs = require('fs');
// const fetch = require('node-fetch'); // Nếu dùng trong main process hoặc Node.js
const cheerio = require('cheerio');
const { app, shell, BrowserWindow, dialog, ipcMain } = require('electron');
const { electronApp, optimizer, is } = require('@electron-toolkit/utils');
import Store from 'electron-store';
import Game from './game.js';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

// ---------------------- var / const / init ----------------------
const store = new Store();

let mainWindow = {}
const windowList = new Map(); // { profile: {wid, url} }
const partitionDir = path.join(app.getPath('userData'), 'Partitions')
fs.existsSync(partitionDir) || fs.mkdirSync(partitionDir, { recursive: true });


// ---------------------- Object / Classess ----------------------
class Profile {
  constructor(id = null, url = 'https://web.telegram.org/k', gameId) {
    if (id) this.id = id
    else this.id = parseInt(store.get('profile_increment') + 1)
    store.set('profile_increment', this.id)
    let wdType = gameId ? 'gameWindow' : 'loginWindow'

    this.wd = new BrowserWindow({
      width: 400, height: 650,
      minHeight: 250, minWidth: 200,
      show: true,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {})
      , webPreferences: {
        preload: path.join(__dirname, '../preload/gamePreload.js')
        , additionalArguments: ['--akiWindowType=' + wdType, '--akiGameId=' + gameId]
        , partition: "persist:profile" + this.id
        , webSecurity: false
        , sandbox: false
        , contextIsolation: false
        // , nodeIntegration: true // Cho phép sử dụng Node.js trong script preload
        // , contextIsolation: false // Tắt context isolation để truy cập trực tiếp object window

      }
    })
    let textLog = id ? 'open' : 'created new';
    console.log(textLog + ' profile id', this.id, 'BrowserId:', this.wd.id, 'url:', url);
    windowList.set(this.id, { wid: this.wd.id, url: url })
    this.wd.once("ready-to-show", () => {
      this.wd.setTitle('profile' + this.id)
      let gameWindow = BrowserWindow.getAllWindows().length - 2;
      this.wd.setPosition(200 * gameWindow, 0 * gameWindow, true)
      mainWindow.webContents.send('data', { name: 'profiles', data: Profile.list })
      mainWindow.webContents.send('data', { name: 'windowList', data: windowList })
    })
    this.wd.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }; // Ngăn chặn mở app ngoài
    });

    this.wd.loadURL(url)
    return this.wd.id
  }

  static get list() {
    // Return list of folders inside PartitionDir
    const profileDir = fs.readdirSync(partitionDir).filter(f =>
      fs.statSync(path.join(partitionDir, f)).isDirectory()
    );
    // Sort profiles by the number in their names
    profileDir.sort((a, b) => {
      const numA = parseInt(a.replace('profile', ''), 10);
      const numB = parseInt(b.replace('profile', ''), 10);
      return numA - numB;
    });
    let profileData = store.get("profileData", {});
    const profileListObject = profileDir.map((dirName) => ({
      id: parseInt(dirName.replace("profile", ""), 10),
      name: dirName,
      tagName: profileData[dirName]?.tagName || '@',
      displayName: profileData[dirName]?.displayName || 'NotLogin',
      uid: profileData[dirName]?.uid || 0,
      avt: profileData[dirName]?.avt || ''
    }));
    return profileListObject;
  }

  static clearAll() {
    const windowsToClose = BrowserWindow.getAllWindows()
      .filter(w => w !== mainWindow);
    for (w of windowsToClose) {
      w.close(); console.log('closed window', w.title, 'id:', w.id);
    }
    for (const prof of Profile.list) {
      console.log('trying remove profile:', prof.name);
      const fPath = path.join(partitionDir, prof.name);
      try {
        fs.rmSync(fPath, { recursive: true });
        console.log('Deleted dir:', fPath);
      } catch (err) {
        console.error('Error deleting directory:', fPath);
      }
    }
    store.set('profile_increment', 0)
    mainWindow.webContents.send('data', { name: 'profiles', data: Profile.list })
    app.relaunch();
    app.exit(0);

  }

  del(profileName) {
    // close all window of this profile
    const windowsToClose = BrowserWindow.getAllWindows()
      .filter(w => w.getTitle() == profileName);
    for (w of windowsToClose) {
      w.close(); console.log('closed window', w.title, 'id:', w.id);
    }
  }
  static init() {
    if (store.get('profile_increment') === undefined) {
      console.log('init first time lauch app. set Profile Increment to 0');
      store.set('profile_increment', 0)
    }
  }
}

// ---------------------- function ----------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 768,
    minHeight: 250,
    minWidth: 400,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/mainPreload.js')
      , sandbox: false
      // , contextIsolation: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    // mainWindow.loadURL(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // shell.showItemInFolder(app.getPath("userData")) // DEB
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('ready-to-show', () => { mainWindow.show() })
  mainWindow.on('close', (event) => { app.quit() })
}
async function fetchBE(tagname) {
  let response = await fetch('https://t.me/' + tagname);
  let html = await response.text();
  const $ = cheerio.load(html);
  let avt = $('div.tgme_page_photo img').attr('src');
  let displayName = $('div.tgme_page_title').text().trim();
  return { avt, displayName };
}




Game.init()
Profile.init()
app.whenReady().then(() => {
  app.commandLine.appendSwitch('disable-site-isolation-trials')
  electronApp.setAppUserModelId('com.aki.teleauto') // need on windows
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createMainWindow()

  //--------------------- IPC 
  ipcMain.on('action', (ev, mess) => {
    // api.ipcAction: (name, data={})
    let senderWd = BrowserWindow.fromWebContents(ev.sender)
    console.log('ipcMain recevied action name:', mess.name, 'data:', mess.data);
    switch (mess.name) {
      case 'newProfile': new Profile(); break;
      case 'loginProfile': new Profile(mess.data.id); break;
      case 'profileDelete':
        let target = mess.data.nameToDelele
        console.log('received action delete profile:', target)
        // WORKING
        break;
      case 'profileDeleteAll': Profile.clearAll(); break;
      case 'openGame':
        let { profileid, link, gameId } = mess.data;
        new Profile(profileid, link, gameId); break;
      case 'loadURL': senderWd.loadURL(mess.data.url); break;
      case 'inspect-at': ev.sender.inspectElement(mess.data.x, mess.data.y); break;
      case 'closethiswindow': senderWd.close(); break;
      default: console.log('ipcMain received "action" but', mess.name, 'not defined yet!'); break;
    }
  })

  ipcMain.on('get', (ev, mess) => {
    // ask for data, then send ipc 'data' to sender window
    let out = {}
    switch (mess) {
      case 'profiles': out.name = 'profiles', out.data = Profile.list; break;
      case 'games': out.name = 'games', out.data = Game.list; break;
      default: console.log('ipcMain received "action" but', mess, 'not defined yet!'); break;
    }
    ev.sender.send('data', out)
  })

  ipcMain.on('data', async (ev, mess) => {
    // api.ipcData: (name, data={})
    let senderWd = BrowserWindow.fromWebContents(ev.sender)
    console.log('ipcMain recevied data name:', mess.name, 'data:', mess.data);
    switch (mess.name) {
      case 'profileUser':
        let profileName = path.basename(ev.sender.session.getStoragePath())
        let data = {}
        let { avt, displayName } = await fetchBE(mess.data.tagName)
        Object.assign(data, mess.data, { avt, displayName })
        store.set(`profileData.${profileName}`, data);
        console.log('saved profileData:', data);
        mainWindow.webContents.send('data', { name: 'profiles', data: Profile.list })
        break;
      default: console.log('ipcMain received "data" but', mess.name, 'not defined yet!'); break;
    }
  })

  ipcMain.handle('get-game-data', (event, gameId) => {
    // gameWindow sẽ gọi cái này 2 lần
    let out = Game.list.find(g => g.gameId == gameId);
    console.log('requested game data:', out);
    return out
  });

  ipcMain.on('log', (ev, mess) => console.log(mess))

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
