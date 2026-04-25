// https://github.com/phaserjs/phaser
import * as Phaser from 'phaser';
import van from "vanjs-core";
import { networkStatus, stateConn, statePhaser, userIdentity } from './context';
import { DbConnection, tables } from './module_bindings';
import { setupDBEntity } from './db/db_entity';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';

const {style, div, input, textarea, button, span, img, label, p, table, tr, td, tbody } = van.tags;

// console.log(Phaser);

const HOST = 'ws://localhost:3000';
const DB_NAME = 'spacetime-app-transform2d';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;
// Global reference to the pane
let tweakPane;


const my_css = style(`
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; 
  background-color: #000;
}
canvas {
  display: block; /* Removes tiny extra space below the canvas */
}
`);
van.add(document.head, my_css);

const config = {
    type: Phaser.AUTO, // Automatically uses WebGL or Canvas

    scale: {
        // mode: Phaser.Scale.FIT, // or Phaser.Scale.ENVELOP
        mode: Phaser.Scale.ENVELOP, // or Phaser.Scale.ENVELOP
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800, // Your logical width
        height: 600, // Your logical height
    },
    // scale: {
    //     mode: Phaser.Scale.RESIZE, // Canvas fills the parent/window
    //     autoCenter: Phaser.Scale.CENTER_BOTH,
    //     width: '100%',
    //     height: '100%'
    // },
    // width: 800,
    // height: 600,
    // physics: {
    //     default: 'arcade',
    //     arcade: { gravity: { y: 300 } }
    // },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Load assets like images or spritesheets
    // this.load.image('sky', 'assets/sky.png');
}
// var rect;
function create() {
    this.cameras.main.centerOn(0, 0);
    this.scale.on('resize', () => {
        this.cameras.main.centerOn(0, 0);
    });
    this.cameras.main.setZoom(20);

    // Initialize game objects and UI
    // this.add.image(400, 300, 'sky');
    // rect = this.add.rectangle(0, 0, 100, 100, 0xff0000);
    // rect.setInteractive()

    // Use degrees (0 to 360)
    // rect.angle = 45;
    // rect.angle += 0.1;

    // OR use radians (0 to Math.PI * 2)
    // rect.rotation = Math.PI / 4; 
}
function update() {
//   rect.angle += 0.1;
    // This function runs continuously for game logic (e.g., player movement)
    // console.log("test");
}

statePhaser.val = game;

// Add this function
function setupTweakPane() {
    const scene = statePhaser.val?.scene?.scenes[0];
    if (!scene) return;

    tweakPane = new Pane({
        title: 'Camera Controls',
        expanded: true,
    });

    const cameraFolder = tweakPane.addFolder({
        title: 'Camera',
        expanded: true,
    });

    // Zoom control
    cameraFolder.addBinding({ zoom: 1 }, 'zoom', {
        min: 0.1,
        max: 20,
        step: 0.05,
    }).on('change', (ev) => {
        scene.cameras.main.setZoom(ev.value);
    });

    // Optional: Reset button
    cameraFolder.addButton({ title: 'Reset Camera' }).on('click', () => {
        scene.cameras.main.setZoom(1);
        scene.cameras.main.centerOn(0, 0);
    });

    // Optional: Position controls
    cameraFolder.addBinding({ x: 0 }, 'x', { step: 10 })
        .on('change', (ev) => scene.cameras.main.scrollX = ev.value);

    cameraFolder.addBinding({ y: 0 }, 'y', { step: 10 })
        .on('change', (ev) => scene.cameras.main.scrollY = ev.value);
}

const conn = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
  .onConnect((conn, identity, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('connnect');
    networkStatus.val = 'Connected';
    stateConn.val = conn;
    // console.log("identity: ", identity);
    console.log("identity: ", identity.toHexString());
    // console.log("conn: ", conn);
    userIdentity.val = identity;
    setup();
  })
  .onDisconnect(() => {
    console.log('Disconnected from SpacetimeDB');
    networkStatus.val = 'Disconnected';
  })
  .onConnectError((_ctx, error) => {
    console.error('Connection error:', error);
    networkStatus.val = 'Connection error';
    // statusEl.textContent = 'Error: ' + error.message;
    // statusEl.style.color = 'red';
  })
  .build();

function setup(){
    setupDBEntity();
    setupDBTransform2Ds();
    setupTweakPane();
}
//-----------------------------------------------
// 
//-----------------------------------------------

function addOrTransform2Ds(ent) {
  if (!ent || !ent.id) return;
  const currentMap = dbTransform2Ds.val;        // get current
  const newMap = new Map(currentMap);           // create copy
  newMap.set(ent.id, ent);
  dbTransform2Ds.val = newMap;                  // assign new Map → triggers update
}

function deleteTransform2Ds(id) {
  if (!id) return;
  // Create new Map without the item
  const newMap = new Map(dbTransform2Ds.val);
  newMap.delete(id);
  // Update the state (this is what makes VanJS detect the change)
  dbTransform2Ds.val = newMap;
}

const phaserObjects = new Map();

function create_box(row){

    const app = statePhaser.val;
    // console.log(app);
    if (!app || !app.scene || !app.scene.scenes[0]) {
        console.warn("Phaser scene not ready yet");
        return;
    }
    const scene = app.scene.scenes[0];     // Get the active scene

    // Prevent creating duplicate objects for the same entity
    if (phaserObjects.has(row.entityId)) {
        console.log(`Box for entity ${row.id} already exists`);
        return;
    }

    // Create the rectangle (box)
    const box = scene.add.rectangle(
        row.position.x || 0,      // x position
        row.position.y || 0,      // y position
        row?.width || 1,   // width
        row?.height || 1,  // height
        0x00ff00            // color (green)
    );

    // Optional: make it interactive or add origin
    box.setOrigin(0.5, 0.5);        // Center origin (common for transforms)
    // box.setInteractive();        // Uncomment if you want clicks
    // Store reference so we can update or delete it later
    phaserObjects.set(row.entityId, box);
    console.log(`Created box for entity ${row.id} at (${row.x}, ${row.y})`);
}

function transformPoint(m, x, y) {
  return {
    x: m[0]*x + m[1]*y + m[2],
    y: m[3]*x + m[4]*y + m[5]
  };
}

function update_transform2ds(row){
    const box = phaserObjects.get(row.entityId);
    if (box) {
        const worldPos = transformPoint(row.worldMatrix, 0, 0);

        box.setPosition(worldPos.x || 0, worldPos.y || 0);
        if (row.width !== undefined) box.width = row.width;
        if (row.height !== undefined) box.height = row.height;
        // box.angle = row.rotation || 0;   // if you have rotation
    }
}

function onInsert_Transform2Ds(_ctx, row){
  console.log(row);
  create_box(row);
  addOrTransform2Ds(row);
}

function onUpdate_Transform2Ds(_ctx, oldRow, newRow){
  // console.log(row);
  addOrTransform2Ds(newRow);
  update_transform2ds(newRow);
}

function onDelete_Transform2Ds(_ctx, row){
  deleteTransform2Ds(row.id)
}

export function setupDBTransform2Ds(){
  // console.log(connState.val)
  const conn = stateConn.val;
  conn.subscriptionBuilder()
      .subscribe(tables.transform2d);

  conn.db.transform2d.onInsert(onInsert_Transform2Ds);
  conn.db.transform2d.onUpdate(onUpdate_Transform2Ds);
  conn.db.transform2d.onDelete(onDelete_Transform2Ds);
}









