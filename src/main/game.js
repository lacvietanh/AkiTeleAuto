import Store from 'electron-store';
const store = new Store();

// requireInApp -> requireMiniApp -> requireMobile
let preConfig = [
  {
    name: "Moonbix", link: "https://t.me/Binance_Moonbix_bot/start?startapp=ref_1617075783&startApp=ref_1617075783"
    , requireMobile: true
    , rating: 5
  },
  {
    name: "CATS", link: "t.me/catsgang_bot/join?startapp=tYbaLFnf8HNHZ3n_vG38F"
    , requireMiniApp: true
    , rating: 4
  },
  {
    name: "MoneyDogs", link: "https://t.me/money_dogs_bot/money_dogs?startapp=JFx1iNTE"
    , rating: 4
  },
  {
    name: "HamsterKombat", link: "https://t.me/haMster_kombat_bot/start?startapp=kentId1617075783",
    requireMobile: true
    , rating: 2
  },
  {
    name: "Agent 301", link: "https://t.me/Agent301Bot/app?startapp=onetime1617075783"
    , requireMiniApp: true
    , rating: 2
  },
  {
    name: "1winToken", link: "http://t.me/token1win_bot/start?startapp=refId1617075783"
    , requireMobile: true
    , rating: 3
  },
  {
    name: "BOOMS", link: "https://t.me/booms_io_bot/start?startapp=bro1617075783"
    , requireMobile: true
    , rating: 3
  },
  {
    name: "NotBoredPuppies", link: "https://t.me/NotBoredPuppies_bot/app?start=r_1617075783"
    , requireMobile: true
    , rating: 2
  },
  {
    name: "Major", link: "https://t.me/major/start?startapp=1617075783"
    , rating: 5
  },
  {
    name: "BITS", link: "https://t.me/BitsTonboxBot/BitsAirdrops?startapp=L8rLKQ5ZqJVhYE1Vx5jePy"
    , rating: 4
  },
  {
    name: "Catizen Game Center", link: "https://t.me/catizenbot/gamecenter?startapp=p_24660687"
    , rating: 4
  },
  {
    name: "Catizen", link: "https://t.me/catizenbot/gameapp?startapp=r_424_25641724"
    , rating: 2
  },
  {
    name: "Bombie", link: "https://t.me/catizenbot/bombie?startapp=g_1002_24660687"
    , rating: 4
  },
  {
    name: "Sunkong", link: "https://t.me/sunkongmyth_bot/sunkong_miniapp?startapp=139FE7A52"
    , rating: 4
  },
  {
    name: "Boinkers", link: "https://t.me/boinker_bot/boinkapp?startapp=boink1617075783"
    , rating: 3
  },
  {
    name: "SEED", link: "t.me/seed_coin_bot/app?startapp=1617075783"
    , rating: 5
  },
  {
    name: "Blum", link: "https://t.me/blum/app?startapp=ref_IDq1XTu1E2",
    requireMiniApp: true
    , rating: 5
  },
  {
    name: "Hexn.io", link: "t.me/hexn_bot/app?startapp=11d051aa-2c1d-4c2c-85f1-2b98146957b0"
    , requireMiniApp: true
    , rating: 3
  },
  {
    name: "MidasYielder", link: "https://t.me/MidasRWA_bot/app?startapp=ref_54bd2269-a3f5-4224-a040-b01830db89b9"
    , requireMiniApp: true
    , rating: 3
  },
  {
    name: "Mnemonics", link: "https://t.me/mnmncs_bot/gameapp?startapp=KA7aDv4R",
    requireMobile: false
    , rating: 5
  },
  { name: "Gumart", link: "https://t.me/gumart_bot/join?startapp=1617075783" },
  {
    name: "Birds", link: "https://t.me/birdx2_bot/birdx?startapp=1617075783"
    , rating: 5
  },
  {
    name: "Memeland", link: "https://t.me/metaland_bot/click?startapp=1617075783"
    , rating: 5
  },
  { name: "PigHouse", link: "https://t.me/PigshouseBot?start=1617075783" },
  {
    name: "GOATS", link: "https://t.me/realgoats_bot/run?startapp=8729955f-213a-428c-baed-d0aad0d262fe"
    , requireMiniApp: true
  },
  {
    name: "CatsDogs", link: "https://t.me/catsdogs_game_bot/join?startapp=1617075783"
    , requireMiniApp: true
    , rating: 2
  },
  {
    name: "MatchQuest", link: "https://t.me/MatchQuestBot/start?startapp=a4427cb30850105ed404fa8e2b64f3bb"
    , rating: 4
  },
  , {
    name: 'MemeFi', link: 'https://t.me/memefi_coin_bot/main?startapp=r_7db5aff3fe',
    requireMobile: true
  }
  , { name: "Coub", link: "https://t.me/coub/app?startapp=coub__marker_20181360" },
  { name: "trust_app", link: "https://t.me/trust_empire_bot/trust_app?startapp=1cc5170a-2f84-4f94-9941-ba01c0f28f81" },
  {
    name: "TimeFarm", link: "https://t.me/TimeFarmCryptoBot?start=ewpWKMx5QA1Vjm3m"
    , launchBtnInBotChat: '.is-web-view.reply-markup-button.rp'
    , requireMiniApp: true
    , rating: 4
  },
  {
    name: "Fintopio", link: "https://t.me/fintopio/wallet?startapp=reflink-reflink_h5vWbSndCMoyEBSG-"
    , requireMiniApp: true
    , rating: 3
  },
  {
    name: "TON Kombat", link: "https://t.me/Ton_kombat_bot/app?startapp=1617075783"
    , requireMiniApp: true
  },
  { name: "OKX Racer", link: "https://t.me/OKX_official_bot/OKX_Racer?startapp=linkCode_124511804" }
  , {
    name: "Tomarket", link: "t.me/Tomarket_ai_bot/app?startapp=0002btvW"
    , rating: 5
    , requireMiniApp: true,
  },
  {
    name: "ZenCoin", link: "https://t.me/theZencoin_bot/zencoin?startapp=r=1617075783",
    requireMobile: false
  },
  { name: "Heart", link: "https://t.me/heart_game_bot/game?startapp=1617075783" },
  {
    name: "Nordom", link: "https://t.me/nordom_gates_bot/open?startapp=YgcyB0"
    , requireMobile: true
  },
  {
    name: "HatchCat", link: "https://t.me/hash_cats_bot?start=rQYJoy1gH1"
    , launchBtnInBotChat: '.is-web-view.reply-markup-button.rp'
    , requireMobile: false
    , rating: 4
  },
  {
    name: "Rating", link: "https://t.me/rating/app?startapp=ref_6c19f21617075783"
    // , requireMobile: false
  },
  {
    name: "ZESH", link: "https://t.me/ZeshToTheMoonBot?start=PY8PHZHi7Vtz",
    launchBtnInBotChat: '.new-message-bot-commands.is-view'
    , requireMiniApp: true
    // requireMobile: false
  },
]
preConfig.sort((a, b) => a.name.localeCompare(b.name));


class Game {
  constructor(gameObj) {
    const defaultConfig = {
      name: "unNamed",
      link: "https://t.me/",
      rating: 0,
      requireMobile: false,
      requireMiniApp: false, // require play inside telegram environment (not external iframe link)
      requireInApp: false, // ex: moonbix can play only inside telegram app
      launchBtnInBotChat: '',

      dailyCheckIn: [], // sequence element to click
      earn: {
        tap: true, boost: [], // sequence element to click
        task: [],
        game: {
          spiner: [], // sequence element to click
          itemDropCatch: {}
        }
      },
      mineCard: [], // element list
    };
    Object.assign(this, defaultConfig, gameObj);

    if (this.link?.startsWith('t.me')) this.link = 'https://' + this.link;
    if (this.link?.startsWith('http')) this.link = this.link.replace('http://', 'https://');

    this.botId = this.link.match(/https:\/\/t\.me\/([^/?]+)/)[1];
    // console.log(this.botId);
    this.gameId = this.link.match(/https:\/\/t\.me\/([^\/?]+\/[^?]+|[^\/?]+)/)[1];
    // console.log(this.gameId);
    this.tgAddr = Game.convertTgAddr(this.link)
    return this
  }

  static list = [];

  static convertTgAddr(gameLink) {
    const urlParts = gameLink.replace('https://t.me/', '').split('/');
    const domain = urlParts[0];  // Domain là phần trước dấu "/"
    // Kiểm tra xem có appname hay không
    if (urlParts.length > 1) {
      // Trường hợp có appname
      const appnameAndQuery = urlParts[1];  // Phần sau dấu "/" là appname và query
      const [appname, queryString] = appnameAndQuery.split('?'); // Tách appname và query
      return `tg://resolve?domain=${domain}&appname=${appname}&${queryString}`;
    } else {
      // Trường hợp không có appname, chỉ có query
      const queryString = domain.split('?')[1];  // Lấy phần query string
      return `tg://resolve?domain=${domain.split('?')[0]}&${queryString}`;
    }
  }
}


let infoStored = store.get('Games', {})
preConfig.forEach(g => {
  let game = new Game(g)
  game.avt = infoStored[game.gameId]?.avt || ''
  Game.list.push(game);
});


export default Game;


