import { stateConn, networkStatus, userIdentity, dbTransform2Ds, stateWorld, statePixi, objTransform2Ds, stateZoomLevel, stateZoomSpeed, stateMinZoom, stateMaxZoom } from './context';
import { DbConnection, tables } from './module_bindings';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import van from "vanjs-core";
import { Modal, MessageBoard } from "vanjs-ui";

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";
import { initPixi } from './pixi_render';
import { setupDBEntity } from './db/db_entity';
import { Graphics } from 'pixi.js';


const {style, div, input, textarea, button, span, img, label, p, table, tr, td, tbody } = van.tags;
const HOST = 'ws://localhost:3000';
const DB_NAME = 'spacetime-app-transform2d';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

const my_css = style(`
body{
  margin: 0;
  overflow: hidden;
}  
`);
van.add(document.head, my_css);
//-----------------------------------------------
// 
//-----------------------------------------------
const conn = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
  .onConnect(async (conn, identity, token) => {
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
//-----------------------------------------------
// 
//-----------------------------------------------

function create_box_test(){
  const world = stateWorld.val;
  const app = statePixi.val;
  // console.log(world);
  // 2. Create a Graphics object
  const rectangle = new Graphics()
    .rect(0, 0, 50, 50) // x, y, width, height
    .fill(0xDE3249)         // Set fill color
    .stroke({ width: 2, color: 0xffffff }); // Optional border
  rectangle.pivot.set(25, 25);
  console.log(rectangle);
  world.addChild(rectangle);
}

function create_box(row){
  console.log(row);
  const world = stateWorld.val;
  const app = statePixi.val;
  // console.log(world);


  // 2. Create a Graphics object
  const rectangle = new Graphics()
    .rect(row.position.x, row.position.y, 50, 50) // x, y, width, height
    .fill(0xDE3249)         // Set fill color
    .stroke({ width: 2, color: 0xffffff }); // Optional border
  rectangle.pivot.set(25, 25);
  // console.log(rectangle);
  world.addChild(rectangle);

  objTransform2Ds.val.set( row.entityId, rectangle)
}


function update_box(row){
  console.log("update_box: ",row);
  const t2 = objTransform2Ds.val.get(row.entityId);
  if(t2){
    t2.position.set(
      row.position.x,
      row.position.y
    );
  }
}
//-----------------------------------------------
// 
//-----------------------------------------------
function addOrUpdateEntity(ent) {
  if (!ent || !ent.id) return;
  const currentMap = dbTransform2Ds.val;        // get current
  const newMap = new Map(currentMap);           // create copy
  newMap.set(ent.id, ent);
  dbTransform2Ds.val = newMap;                  // assign new Map → triggers update
}
function deleteEntity(id) {
  if (!id) return;
  // Create new Map without the item
  const newMap = new Map(dbTransform2Ds.val);
  newMap.delete(id);
  // Update the state (this is what makes VanJS detect the change)
  dbTransform2Ds.val = newMap;
}
function onInsert_Transform2Ds(_ctx, row){
  // console.log(row);
  addOrUpdateEntity(row);
  create_box(row);
}
function onUpdate_Transform2Ds(_ctx, oldRow, newRow){
  // console.log(row);
  addOrUpdateEntity(newRow);
  update_box(newRow);
}
function onDelete_Transform2Ds(_ctx, row){
  deleteEntity(row.id)
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
//-----------------------------------------------
// 
//-----------------------------------------------
function setupPane(){
  const pane = new Pane();

  const zoomFolder = pane.addFolder({
    title:"Zoom"
  })

  zoomFolder.addBinding(stateZoomLevel, 'val',{
    label:"Level",
    readonly:true,
  })

  zoomFolder.addBinding(stateZoomLevel, 'val',{
    label:"Level",
    min:0.1,
    max:5,
  }).on('change',()=>{
    let zoomLevel = stateZoomLevel.val;
    // zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
    zoomLevel = Math.max(stateMinZoom.val, Math.min(stateMaxZoom.val, zoomLevel ));
    stateZoomLevel.val = zoomLevel;
    // Apply zoom to the world container (your "camera")
    stateWorld.val.scale.set(zoomLevel, zoomLevel);
  });

  zoomFolder.addBinding(stateZoomSpeed, 'val',{
    label:"Speed",
  })

  zoomFolder.addBinding(stateMinZoom, 'val',{
    label:"Min",
  })

  zoomFolder.addBinding(stateMaxZoom, 'val',{
    label:"Max",
  })


}
//-----------------------------------------------
// 
//-----------------------------------------------
async function setup(){
  await initPixi();
  setupDBEntity();
  setupDBTransform2Ds();
  // create_box_test();
  setupPane();
}

