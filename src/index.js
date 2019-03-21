import { assets, devConsole } from './lib/utils';
import './index.css';

export let app = {
  isInitialized: false,
  locale: null,
  platform: null,
  sdkVersion: null,
  contextId: null,
  contextType: null,
  playerId: null,
  playerName: null,
  playerPic: null
}

async function main() {
  await init();
  await load();
  await start();

  devConsole.log(app);

  /**@type {HTMLCanvasElement}*/
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  const WIDTH = ctx.canvas.width;      // Draw buffer width
  const HEIGHT = ctx.canvas.height;    // Draw buffer height

  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;

  ctx.fillStyle = 'black';
  ctx.font = '32px Arial';
  ctx.textBaseline = 'top';
  const text = `Welcome ${app.playerName} !`;
  const textWidth = ctx.measureText(text).width;
  const textHeight = ctx.measureText('M').width;
  ctx.fillText(text, CENTER_X - textWidth / 2, CENTER_Y - textHeight / 2);

  let [x, y] = [CENTER_X, HEIGHT / 4];
  let image = assets['assets/cat.png'];
  ctx.drawImage(image, x - image.width / 2, y - image.height / 2);

  [x, y] = [CENTER_X, HEIGHT * 3 / 4];
  image = assets['assets/tiger.png'];
  ctx.drawImage(image, x - image.width / 2, y - image.height / 2);
}

async function init() {
  try {
    await FBInstant.initializeAsync();
    devConsole.log('Init success');
    app.isInitialized = true;
    app.locale = FBInstant.getLocale();
    app.platform = FBInstant.getPlatform();
    app.sdkVersion = FBInstant.getSDKVersion();
  } catch (err) {
    devConsole.warn(err);
  }
  return app.isInitialized;
}

async function load() {
  if (!app.isInitialized) return false;
  await assets.load([
    'assets/animals.png',
    'assets/cat.png',
    'assets/hedgehog.png',
    'assets/tiger.png',
  ]);
  return true;
}

async function start() {
  if (!app.isInitialized) return false;
  try {
    await FBInstant.startGameAsync();
    app.contextId = FBInstant.context.getID();
    app.contextType = FBInstant.context.getType();
    app.playerId = FBInstant.player.getID();
    app.playerName = FBInstant.player.getName();
    app.playerPic = FBInstant.player.getPhoto();
    return true;
  } catch (err) {
    devConsole.warn(err);
    return false;
  }
}

main();