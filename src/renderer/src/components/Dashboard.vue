<script setup>
  window.$id = (id) => document.getElementById(id)
  window.$qs = (s) => document.querySelector(s)
  window.$qsa = (s) => document.querySelectorAll(s)
  window.mainLog = (s, hereLog = 0) => {
    ipcRenderer.send('log', s)
    if (hereLog == 1) console.log(s);
  }

  import { onMounted, computed, reactive } from 'vue';
  import { debounce } from 'lodash';
  import AppIcon from '../assets/img/icon.png';

  const windowList = new Map()

  const Game = reactive({
    list: []
    , searchTerm: ''
    , filteredGames: computed(() => {
      const searchTerm = Game.searchTerm.toLowerCase();
      return Game.list.filter((game) => {
        return game.name.toLowerCase().includes(searchTerm);
      });
    })
    , updateSearchTerm: debounce(function (value) {
      this.searchTerm = value;
    }, 300)
    , open: (link, gameId) => {
      if (!Profile.selected) Profile.selected = 'profile1'
      let profileid = parseInt(Profile.selected.replace('profile', ''), 10);
      api.ipcAction('openGame', { profileid: profileid, link: link, gameId: gameId })
    }
    , openAll: function () {
      alert('under development..')
    }, updateData: function (gameObj) {

    }
  })

  const Profile = reactive({
    list: [],
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


  onMounted(() => {
    Profile.load();
    api.ipcGet('games')
  })

  electron.ipcRenderer.on('data', (ev, mess) => {
    console.log(`ipc received "${mess.name}"" data:`, mess.data);
    switch (mess.name) {
      case "profiles":
        Profile.list = window.Profiles = mess.data;
        Profile.isLoadingAddNew = false
        setTimeout(() => {
          $qsa('.GAME .panelRight').forEach(p => {
            let b = p.querySelector('button:not([disabled])')
            b.classList.add('firstAvailable')
          })
        }, 500)
        break;
      case "games": Game.list = window.Game = mess.data; break;
      case "gameInfo":
        // console.log('received game info for ', mess.data.gameId); // debug
        let g = Game.list.find(g => g.gameId == mess.data.gameId);
        Object.assign(g, mess.data.obj)
        break;
      case "windowList": mess.data.forEach((value, key) => {
        windowList.set(key, value);
      }); break;
      default: console.log('ipcRender received "data" but', mess.name, 'not defined yet!');
        break;
    }
  })
</script>

<template>

  <section class="is-flex is-justify-content-space-between">
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
        <a v-for="(profile, i) in Profile.list" :key="i" class="panel-block px-2 py-1"
          :class="{ 'selected': Profile.selected == profile.name }"
          @click="Profile.selected = profile.name">
          <div class="counter">
            <span class="help mr-1" style="width: 2em;">{{ i + 1 }}</span>
          </div>
          <div class="iconName">
            <span class="panel-icon p-0 is-size-3 mr-4">
              <figure v-if="profile.avt" class="image" style="height: 40px;width: 40px;">
                <img class=" is-rounded" :src="profile.avt" />
              </figure>
              <i v-else class="fa-solid fa-user-circle fa-lg"></i>
            </span>
            <div class="is-flex is-justify-content-space-between">
              <div class="name">
                <div>{{ profile.displayName || 'Name' }}</div>
                <div class="help">{{ profile.name }}</div>
              </div>
              <div class="name">
                <span>{{ profile.tagName || '@' }}</span>
                <span class="help">{{ profile.uid || ':' }}</span>
              </div>
            </div>
            <div>
              <!-- profile window counter  -->
              <span class=""><i class="fa-regular fa-window-maximize"></i></span>
              <span class="mx-1">{{ profile.windowCount || 0 }}</span>
              <!-- close button  -->
              <button v-if="profile.windowCount > 0" class="mini button is-ghost">
                <span><i class=" fa-solid fa-xmark fa-xl"></i></span>
              </button>
              <!-- delete profile button  -->
              <button v-if="Profile.currentTab == 'Edit'" class="px-1"
                @click.stop="Profile.delete(profile.name)">
                <span><i class="fa-solid fa-trash has-text-danger"></i></span>
              </button>
            </div>
          </div>
        </a>

        <a class="panel-block is-justify-content-center buttons">
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
        </a>

      </div>
    </article>

    <article class="GAME panel m-3 is-dark">
      <p class="panel-heading py-2">Games/MiniApps <span class="is-size-6">({{ Game.list.length }})</span></p>
      <p class="panel-tabs">
        <a class="is-active">
          <i class="fa-solid fa-calendar-check"></i>
          Open All
        </a>
        <a class="is-active">
          <i class="fa-solid fa-hourglass-start"></i>
          Reload
        </a>
      </p>
      <a class="panel-block px-2 py-1" style="cursor:default">
        <button v-if="Profile.list.length > 0" class="button is-small is-flex is-justify-content-center mx-auto" @click="Profile.login">
          <span class="panel-icon p-0 is-size-5 mr-2">
            <i class="fa-brands fa-telegram"></i>
          </span>
          <span>Telegram</span>
        </button>
        <button class="button is-small is-flex is-justify-content-center mx-auto" @click="Game.openAll">
          <span class="panel-icon p-0 is-size-5 mr-2">
            <i class="fa-solid fa-gavel"></i>
          </span>
          <span>OpenAll</span>
        </button>
      </a>

      <!-- GAME SEARCH  -->
      <div class="panel-block">
        <p class="control has-icons-left">
          <input type="search" class="input is-small is-dark" v-model="Game.searchTerm" @input="Game.updateSearchTerm($event.target.value)" />
          <span class="icon is-left">
            <i class="fas fa-search"></i>
          </span>
        </p>
      </div>
      <!-- GAME LIST  -->
      <div class="vscroll-container">
        <div v-for="(g, i) in Game.filteredGames" :key="i" class="panel-block px-2 py-1">
          <div class="counter"><span class="help mr-1" style="width: 2em;">{{ i + 1 }}</span></div>
          <div class="iconName mr-2">
            <span class="panel-icon p-0 is-size-3 mr-2">
              <figure class="image" style="height: 36px;width: 36px;">
                <img class=" is-rounded" :src="g.avt || AppIcon" />
              </figure>
            </span>
            <div class="name is-flex is-justify-content-space-between">
              <div>{{ g.name }}</div>
            </div>
          </div>
          <div class="panelRight" @click="Game.open(g.link, g.gameId)">
            <button :disabled="g.requireMiniApp || g.requireInApp" class="button" title="Open External">
              <i class="fa-solid fa-rocket fa-lg"></i>
            </button>
            <button :disabled="g.requireInApp" class="button" title="Open In TeleWeb">
              <i class="fa-solid fa-layer-group fa-lg"></i>
            </button>
            <button class="button" title="Open In TeleApp">
              <i class="fa-brands fa-telegram fa-xl"></i>
            </button>
          </div>
        </div>
      </div>

    </article>
  </section>
</template>

<style>
  .panel-block .iconName {
    display: inline-flex;
    align-items: center;
  }
  .panel-block .iconName .name {
    width: 7em;
    white-space: nowrap;
  }
  .panel-block .panelRight {
    display: flex;
    margin-left: auto;
  }
  .panel-block .panelRight button {
    margin: 0 3px;
    padding: 12px;
  }
  .panelRight button.firstAvailable {
    border: 1px solid green;
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