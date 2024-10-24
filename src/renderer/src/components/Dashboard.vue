<script setup>
  window.$id = (id) => document.getElementById(id)
  window.$qs = (s) => document.querySelector(s)
  window.$qsa = (s) => document.querySelectorAll(s)
  window.mainLog = (s, hereLog = 0) => {
    ipcRenderer.send('log', s)
    if (hereLog == 1) console.log(s);
  }

  import { onMounted, watch, computed, reactive, nextTick } from 'vue';
  import { debounce } from 'lodash';
  import AppIcon from '/img/icon.png';
  import Rating from './Rating.vue';

  const windowList = new Map()
  window.windowList = windowList;

  onMounted(() => {
    Profile.load();
    api.ipcGet('games')
  })

  const Profile = reactive({
    list: [],
    selected: 'profile1',
    isLoadingAddNew: false,
    isLoadingDeleteAll: false,
    currentTab: 'Profile',
    add() {
      api.ipcAction('newProfile');
      Profile.isLoadingAddNew = true;
    },
    load() {
      api.ipcGet('profiles')
    },
    login() {
      let profileid;
      if (!Profile.selected) Profile.selected = 'profile1'
      profileid = parseInt(Profile.selected.replace('profile', ''), 10);
      api.ipcAction('loginProfile', { id: profileid })
    },
    delete(profileName) {
      api.ipcAction('profileDelete', { nameToDelele: profileName })
    },
    deleteAll() {
      Profile.isLoadingDeleteAll = true
      api.ipcAction('profileDeleteAll')
      setTimeout(() => { Profile.isLoadingDeleteAll = false }, 1000);
    }
  });


  const Game = reactive({
    list: [],

    highLightFirstAvailable: function () {
      document.querySelectorAll('.GAME .panelRight button').forEach(b => b.classList.remove('firstAvailable'));
      document.querySelectorAll('.GAME .panelRight').forEach(p => {
        p.querySelector('button:not([disabled])')?.classList.add('firstAvailable');
      });
    }
    , searchTerm: ''
    , filteredGames: computed(() => {
      const searchTerm = Game.searchTerm.toLowerCase();
      return Game.list.filter((game) => {
        return game.name.toLowerCase().includes(searchTerm);
      });
    })
    , isLoadingOpen: false
    , updateSearchTerm: debounce(function (value) {
      this.searchTerm = value;
      this.limitOpenAllTo =
        this.filteredGames.length > this.maximumOpenAll
          ? this.maximumOpenAll
          : this.filteredGames.length
      Game.highLightFirstAvailable()
    }, 300),

    lastClickOpen: '',
    open: (g, forceMode) => {
      Game.lastClickOpen = g.gameId;
      Game.isLoadingOpen = true;
      if (!Profile.selected) Profile.selected = 'profile1'
      let profileid = parseInt(Profile.selected.replace('profile', ''), 10);
      api.ipcAction('openGame', { profileid: profileid, link: g.link, gameId: g.gameId, forceMode: forceMode })
    },

    openInAllProfiles: function (g) {
      for (const p of Profile.list) {
        Profile.selected = p.name; Game.open(g)
      }
    },

    waitToClick(btn) {
      if (!Game.isLoadingOpen) {
        console.log('clicked', btn.title);
        btn.click()
      } else {
        console.log('waitToClick', btn.title);
        setTimeout(() => { Game.waitToClick(btn) }, 1000)
      }
    },

    limitOpenAllFrom: 1,
    limitOpenAllTo: 10,
    maximumOpenAll: 15,

    openAll: function (btnClicked) {
      btnClicked.disabled = true;
      let listToOpen = $qsa('.GAME .inSelectedRange .panelRight button.firstAvailable')
      listToOpen.forEach(b => { Game.waitToClick(b) })
      setTimeout(() => { btnClicked.disabled = false }, listToOpen.length * 3 * 1000)
    },

    isOpened: function (g) {
      return false
      // under development

      let profileId = Profile.selected.replace('profile', '')
      console.log(profileId, g.gameId, windowList.get(1))
      let { gameId } = windowList.get(profileId) || ''
      return gameId === g.gameId
    },

    updateData: function (gameObj) {
      // under development
    },
  });

  watch(() => Game.filteredGames, async () => {
    await nextTick();  // Đảm bảo Vue đã cập nhật DOM
    Game.highLightFirstAvailable();
  });


  electron.ipcRenderer.on('data', (ev, mess) => {
    console.log(`ipc Dashboard received "${mess.name}"" data:`, mess.data);
    switch (mess.name) {
      case "profiles":
        Profile.list = window.Profiles = mess.data;
        Profile.isLoadingAddNew = false
        break;
      case "games": Game.list = window.Games = mess.data; Game.highLightFirstAvailable(); break;
      case "gameInfo":
        // console.log('received game info for ', mess.data.gameId); // debug
        let g = Game.list.find(g => g.gameId == mess.data.gameId);
        Object.assign(g, mess.data.obj)
        break;
      case "windowList":
        mess.data.forEach((value, key) => {
          windowList.set(key, value);
        });
        Game.highLightFirstAvailable()
        break;
      default: console.log('ipcRender received "data" but', mess.name, 'not defined yet!');
        break;
    }
  })

  electron.ipcRenderer.on('gameWindowLoaded', () => { Game.isLoadingOpen = false; Game.lastClickOpen = '' })

</script>

<template>

  <section id="HOME" class="is-flex is-justify-content-space-between">
    <article class="panel m-3 is-dark">
      <p class="panel-heading py-2">
        <i class="fa-brands fa-telegram"></i>
        Profiles
        <span class="is-size-6"> ({{ Profile.list.length }})</span>
      </p>
      <div class="panel-block">
        <p class="control has-icons-left">
          <input class="input is-small is-dark" type="search" placeholder="Search" />
          <span class="icon is-left">
            <i class="fas fa-search"></i>
          </span>
        </p>
      </div>
      <p class="panel-tabs">
        <a :class="{ 'is-active': Profile.currentTab == 'Profile' }" @click="Profile.currentTab = 'Profile'"> Profile </a>
        <a :class="{ 'is-active': Profile.currentTab == 'FullName' }" @click="Profile.currentTab = 'FullName'"> FullName </a>
        <a :class="{ 'is-active': Profile.currentTab == 'Edit' }" @click="Profile.currentTab = 'Edit'"> Edit </a>
      </p>
      <div class="vscroll-container">
        <a v-for="(p, i) in Profile.list" :key="i" class="panel-block px-2 py-1"
          :class="{ 'selected': Profile.selected == p.name }"
          @click="Profile.selected = p.name">
          <div class="counter">
            <span style="width: 2em;" class="help">{{ i + 1 }}</span>
          </div>
          <div class="iconName">
            <span class="panel-icon p-0 is-size-3 mr-4">
              <figure v-if="p.avt" class="image" style="height: 40px;width: 40px;">
                <img class=" is-rounded" :src="p.avt" @error="() => { p.avt = AppIcon }" />
              </figure>
              <i v-else class="fa-solid fa-user-circle fa-lg"></i>
            </span>
            <div class="is-flex is-justify-content-space-between">
              <div class="name">
                <p>{{ p.displayName || 'Name' }}</p>
                <div class="help">{{ p.name }}</div>
              </div>
              <div class="name">
                <p>{{ p.tagName || '@' }}</p>
                <span class="help">{{ p.uid || ':' }}</span>
              </div>
            </div>
            <div>
              <!-- profile window counter  -->
              <span class=""><i class="fa-regular fa-window-maximize"></i></span>
              <span class="mx-1">{{ p.windowCount || 0 }}</span>
              <!-- close button  -->
              <button v-if="p.windowCount > 0" class="mini button is-ghost">
                <span><i class=" fa-solid fa-xmark fa-xl"></i></span>
              </button>
              <!-- delete profile button  -->
              <button v-if="Profile.currentTab == 'Edit'" class="px-1"
                @click.stop="Profile.delete(p.name)">
                <span><i class="fa-solid fa-trash has-text-danger"></i></span>
              </button>
            </div>
          </div>
        </a>

        <div class="panel-block is-justify-content-center buttons">
          <button v-if="Profile.currentTab == 'Profile'" class="button is-success" @click="Profile.add" :class="{ 'is-loading': Profile.isLoadingAddNew }">
            <span class="icon">
              <i class="fa-solid fa-plus-circle fa-lg"></i>
            </span>
            <span class="">Add Profile</span>
          </button>
          <button v-if="Profile.currentTab == 'Edit'" class="button is-danger" @click="Profile.deleteAll" :class="{ 'is-loading': Profile.isLoadingDeleteAll }">
            <span class="icon">
              <i class="fa-solid fa-trash-can fa-lg"></i>
            </span>
            <span class="">DeleteAll</span>
          </button>
        </div>

      </div>
    </article>

    <article class="GAME panel m-3 is-dark">
      <p class="panel-heading py-2">Games/MiniApps <span class="is-size-6">({{ Game.list.length }})</span></p>
      <!-- GAME SEARCH  -->
      <div class="panel-block">
        <div class="field has-addons" style="flex:1">
          <p class="control has-icons-left is-expanded" style="flex: 1;">
            <input type="search" class="input is-small is-dark" v-model="Game.searchTerm" @input="Game.updateSearchTerm($event.target.value)" />
            <span class="icon is-left">
              <i class="fas fa-search"></i>
            </span>
          </p>
          <p class="control">
            <button class="button is-small" @click="Game.list.sort((a, b) => b.rating - a.rating);">
              <span>Rating</span>
              <span class="icon"><i class="fa-solid fa-arrow-down-wide-short"></i></span>
            </button>
          </p>
          <p class="control">
            <button class="button is-small" @click="Game.list.sort((a, b) => a.name.localeCompare(b.name))">
              <span>A-Z</span>
              <span class="icon"><i class="fa-solid fa-arrow-down-wide-short"></i></span>
            </button>
          </p>
        </div>
      </div>

      <!-- instructions  -->
      <p class="panel-tabs is-size-7">
        <span class="has-text-danger p-2">
          <i class="fa-solid fa-gavel fa-lg"></i>
          Open by All Profile
        </span>
        <span class="p-2">
          <i class="fa-solid fa-rocket fa-lg"></i>
          External
        </span>
        <span class="p-2">
          <i class="fa-solid fa-layer-group fa-lg"></i>
          TgWeb
        </span>
        <span class="p-2">
          <i class="fa-brands fa-telegram fa-xl"></i>
          TgApp
        </span>
      </p>

      <!-- special buttons -->
      <div class="panel-block px-2 py-1" style="cursor:default">
        <button v-if="Profile.list.length > 0" class="button is-small mr-2" @click="Profile.login">
          <span class="panel-icon p-0 mr-2">
            <i class="fa-brands fa-telegram fa-xl"></i>
          </span>
          <span>Telegram</span>
        </button>
        <div class="field has-addons">
          <p class="control">
            <button class="button is-small is-primary is-outlined is-flex is-justify-content-center mx-auto" @click="Game.openAll($event.target)">
              <span class="panel-icon p-0 mr-2 has-text-primary">
                <i class="fa-solid fa-gavel fa-lg"></i>
              </span>
              <span>OpenAll ({{ Profile.selected }})</span>
            </button>
          </p>
          <p class="control">
            <input type="number" class="input is-small is-primary" min="1" :max="Game.limitOpenAllTo" v-model="Game.limitOpenAllFrom">
          </p>
          <p class="control">
            <input type="number" class="input is-small is-primary" min="1" :max="Game.filteredGames.length" v-model="Game.limitOpenAllTo">
          </p>
        </div>
      </div>

      <!-- GAME LIST  -->
      <div class="vscroll-container">
        <div v-for="(g, i) in Game.filteredGames" :key="i"
          :class="{
            'panel-block px-2 py-1': true,
            'inSelectedRange': (Game.limitOpenAllFrom <= (i + 1)) && ((i + 1) <= Game.limitOpenAllTo)
          }">
          <div class="counter">
            <span style="width: 2em;" :class="{
              'help mr-1': true,
              'tag is-small is-black p-1 m-0 has-text-primary': (Game.limitOpenAllFrom <= (i + 1)) && ((i + 1) <= Game.limitOpenAllTo)
            }">{{ i + 1 }}</span>
          </div>
          <div class="iconName mr-2">
            <span class="panel-icon p-0 is-size-3 mr-2">
              <figure :class="['image', { 'gameIsOpen': Game.isOpened(g) }]" style="height: 34px;width: 34px;">
                <div v-if="Game.lastClickOpen == g.gameId && Game.isLoadingOpen" class="loader"></div>
                <img :class="['is-rounded', { 'relativeLoading': Game.lastClickOpen == g.gameId && Game.isLoadingOpen }]" :src="g.avt" @error="() => { g.avt = AppIcon }" />
              </figure>
            </span>
            <div class="name is-flex is-justify-content-space-between">
              <p>{{ g.name }}</p>
            </div>
          </div>

          <button :title="'Open ' + g.name + 'with All Profile'"
            @click="Game.openInAllProfiles(g)"
            :disabled="g.requireInApp || Game.isLoadingOpen"
            :class="['button is-ghost has-text-danger']">
            <i class="fa-solid fa-gavel fa-lg"></i>
          </button>

          <div class="panelRight mx-2">
            <button :title="'Open ' + g.name + 'in new Window'"
              @click="Game.open(g, 'external')"
              :disabled="g.requireMiniApp || g.requireInApp || Game.isLoadingOpen"
              :class="['button']">
              <i class="fa-solid fa-rocket fa-lg"></i>
            </button>
            <button :title="'Open ' + g.name + ' in TeleWeb'"
              @click="Game.open(g, 'tgweb')"
              :disabled="g.requireInApp || Game.isLoadingOpen"
              :class="['button']">
              <i class="fa-solid fa-layer-group fa-lg"></i>
            </button>
            <button class="button py-3 px-1" :title="'Open ' + g.name + ' in TeleApp'"
              @click="Game.open(g, 'tgapp')"
              :disabled="Game.isLoadingOpen">
              <i class="fa-brands fa-telegram fa-xl"></i>
            </button>
          </div>
          <p class="help">
            <Rating :rating="g.rating" style="white-space: nowrap;" />
          </p>
        </div>
      </div>

    </article>
  </section>
</template>

<style>
  .gameIsOpen {
    border: 3px solid #00d1b2;
    border-radius: 100%;
    transform: scale(1.1);
  }
  img.relativeLoading {
    position: relative;
    top: -33px;
    left: -1px;
    z-index: -1;
    transform: scale(0.8);
  }
  .panel-block .iconName {
    display: inline-flex;
    align-items: center;
  }
  .panel-block .iconName .name {
    width: 8em;
    margin: auto 5px;
  }
  .panel-block .iconName .name p {
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .panel-block .panelRight {
    display: flex;
  }
  .panel-block .panelRight button {
    margin: 0 3px;
    padding: 14px 7px;
  }
  .panelRight button.firstAvailable {
    background-color: transparent;
    border: 1px solid rgb(0, 209, 178);
    color: rgb(0, 209, 178);
  }
  .panel-block.selected {
    background-color: var(--bulma-primary-dark);
  }
  .vscroll-container {
    height: 85vh;
    min-height: 10rem;
    max-height: 1400px;
    overflow-y: auto;
  }
  .panel-tabs a {
    padding: 0.5em;
  }
</style>