//-----------------------------------------------
// index
//-----------------------------------------------
import { connState, networkStatus, userIdentity } from './context';
import { DbConnection, tables } from './module_bindings';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import van from "vanjs-core";
import { Modal, MessageBoard } from "vanjs-ui";
// import { windowRegister } from './window_register';
// import { windowLogin } from './window_login';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";

const { div, input, textarea, button, span, img, label, p, table, tr, td, tbody } = van.tags;
const HOST = 'ws://localhost:3000';
const DB_NAME = 'spacetime-app-transform2d';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;
const board = new MessageBoard({top: "20px"})


//-----------------------------------------------
//
//-----------------------------------------------
function degreeToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function radiansToDegree(radians) {
  return radians * (180 / Math.PI);
}

// Matrix is now stored as a flat array: [a, b, c, d, e, f, 0, 0, 1]  (row-major, 3x3)
// type Matrix2D = [number, number, number, number, number, number, number, number, number];
const Matrix2D = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function translate2D(x, y) {
  return [1, 0, x, 0, 1, y, 0, 0, 1];
}
function rotate2D(angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
function scale2D(sx, sy) {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}
// Matrix multiplication: C = A * B  (row-major)
function multiply2D(a, b){
  const r = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        r[i*3 + j] += a[i*3 + k] * b[k*3 + j];
      }
    }
  }
  return r;
}
function transformPoint(m, x, y) {
  return {
    x: m[0]*x + m[1]*y + m[2],
    y: m[3]*x + m[4]*y + m[5]
  };
}
/**
 * Extracts rotation angle in degrees from a 2D affine matrix (flattened 3x3).
 * Works even with scaling and translation present.
 */
function getRotationFromMatrix(m) {
  // Linear part: [ m[0]  m[1] ]
  //               [ m[3]  m[4] ]

  // Use atan2 on the Y-axis vector after transform (more stable)
  const angleRad = Math.atan2(m[3], m[0]);   // sin / cos from first column

  return angleRad * (180 / Math.PI);
}

/**
 * Extract average scale from the 2D world matrix
 */
function getScaleFromMatrix(m) {
  const scaleX = Math.hypot(m[0], m[3]);   // length of transformed X axis
  const scaleY = Math.hypot(m[1], m[4]);   // length of transformed Y axis

  return { x: scaleX, y: scaleY };
}

function extractWorldRotation(worldMatrix){
  // Use the first column (or second) - more stable than atan2 on b
  const a = worldMatrix[0];  // m00
  const c = worldMatrix[3];  // m10   (this is sin part in your convention)

  const angleRad = Math.atan2(c, a);        // This gives correct angle even with scale
  let angleDeg = angleRad * (180 / Math.PI);

  // Normalize to 0-360 or -180 to 180 if you prefer
  if (angleDeg < 0) angleDeg += 360;

  return angleDeg;
}

let scene;
let camera;
let renderer;
let gizmo;
let orbitControls;
let deleteEntityBinding;
let marker;
let addTransform2DBinding;
let removeTransform2DBinding;
let position2DBinding;
let rotation2DBinding;
let scale2DBinding;
let hierarchyParentBinding;

const PARAMS = {
  entityId:'',
  entities:[],
  transform2d:[],
  t2_position:{x:0,y:0},
  t2_rotation:0,
  t2_scale:{x:1,y:1},
}

//-----------------------------------------------
//
//-----------------------------------------------
const conn = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
  .onConnect((conn, identity, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('connnect');
    networkStatus.val = 'Connected';
    connState.val = conn;
    // console.log("identity: ", identity);
    console.log("identity: ", identity.toHexString());
    // console.log("conn: ", conn);
    userIdentity.val = identity;
    initDB();
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

function initDB(){
  // setUpDBUser();
  setupDBEntity();
  setupDBTransform2D();
}

function onInsert_Entity(_ctx, row){
  console.log(row);
  PARAMS.entities.push(row);
  update_entities_list();
}

function onDelete_Entity(_ctx, row){
  PARAMS.entities=PARAMS.entities.filter(r=>r.id!=row.id)
  update_entities_list();
}

function setupDBEntity(){
  conn.subscriptionBuilder()
    .subscribe(tables.entity)
  conn.db.entity.onInsert(onInsert_Entity)
  conn.db.entity.onDelete(onDelete_Entity)
}
//-----------------------------------------------
// TRANSFORM 3D
//-----------------------------------------------
function createBox(){
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const wireframe = new THREE.WireframeGeometry( geometry );
  const edges = new THREE.EdgesGeometry(geometry);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // const cube = new THREE.Mesh(wireframe, material);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  // const cubeLine = new THREE.LineSegments(wireframe, lineMaterial);
  const cubeLine = new THREE.LineSegments(edges, lineMaterial);
  cubeLine.matrixAutoUpdate = false; // disable to use matrix
  const axesHelper = new THREE.AxesHelper( 1 ); // '5' is the line size
  cubeLine.add( axesHelper );
  // console.log(cubeLine);
  return cubeLine;
}

//-----------------------------------------------
// TRANSFORM 2D
//-----------------------------------------------

function create_2d(){
  let size = 1
  const geometry = new THREE.PlaneGeometry(size, size);

  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.LineSegments(edges, lineMaterial);
  // mesh.matrixAutoUpdate = false; // disable to use matrix
  return mesh;
}

function update_model2d(mesh, row){
  const worldPos = transformPoint(row.worldMatrix, 0, 0);
  // let worldRotation = getRotationFromMatrix(row.worldMatrix)
  let worldScale = getScaleFromMatrix(row.worldMatrix)
  if(row.parentId != ""){
    // console.log(worldPos);
    // console.log(row.worldMatrix);
    // console.log("x:",row.worldMatrix[2]);
  }
  // worldRotation = row.rotation;
  mesh.position.set(worldPos.x, worldPos.y, 0);
  // console.log(worldRotation);
  // mesh.rotation.z = worldRotation;
  const worldRot = extractWorldRotation(row.worldMatrix)
  mesh.rotation.z = worldRot * (Math.PI / 180); 
  mesh.scale.set(worldScale.x, worldScale.y, 1);
}

function insert_model2d(row){
  let cmesh = create_2d();
  cmesh.userData.row = row;
  if(row.worldMatrix){
    // console.log(row.worldMatrix)
    // m3.fromArray(row.worldMatrix);
    update_model2d(cmesh, row);
  }
  scene.add(cmesh)
}

function onInsert_Transfrom2D(_ctx, row){
  // console.log("transform");
  // console.log(row);
  PARAMS.transform2d.push(row);
  insert_model2d(row);
}

function onUpdate_Transfrom2D(_ctx, oldRow, newRow){
  // console.log("transform");
  // console.log(row);
  PARAMS.transform2d = PARAMS.transform2d.filter(r=>r.entityId != newRow.entityId);
  PARAMS.transform2d.push(newRow);

  const cmesh = scene.children.find(r=>r.userData?.row?.entityId == newRow.entityId);
  if(cmesh){
    if(newRow.worldMatrix){
      // console.log(newRow.worldMatrix)
      update_model2d(cmesh, newRow);
    }
  }
}

function delete_model2D(ctx, row){
  for(const mesh of scene.children){
    if(mesh.userData?.row?.entityId == row.entityId){
      scene.remove(mesh);
      break;
    }
  }
  PARAMS.transform2d=PARAMS.transform2d.filter(r=>r.entityId!=row.entityId)
}

function setupDBTransform2D(){
  conn.subscriptionBuilder()
    .subscribe(tables.transform2d)
  conn.db.transform2d.onInsert(onInsert_Transfrom2D)
  conn.db.transform2d.onUpdate(onUpdate_Transfrom2D)
  conn.db.transform2d.onDelete(delete_model2D)
}
//-----------------------------------------------
// 
//-----------------------------------------------
function App(){
  return div(
    div(
      label(() => `Status: ${networkStatus.val}`),
    ),
    div(
      // button({onclick:()=>showLoginWindow()},'Login')
    )
  )
}

function setup_three(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera.position.z = 5;
  gizmo = new ViewportGizmo(camera, renderer,{
    placement: 'bottom-left',
    // offset: { left: 10, bottom: 10 } // fine-tune distance from edges
  });
  orbitControls = new OrbitControls( camera, renderer.domElement );
  gizmo.attachControls(orbitControls);
  const size = 10;
  const divisions = 10;
  const gridHelper = new THREE.GridHelper( size, divisions );
  scene.add( gridHelper );

  const geometry = new THREE.OctahedronGeometry(0.4);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
  marker = new THREE.LineSegments(edges, lineMaterial);
  scene.add(marker)

  window.addEventListener('resize',onResize);

  // Start the loop
  renderer.setAnimationLoop(animate);
}

function onResize(){
  // 1. Update sizes based on the new window dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 2. Update camera aspect ratio to prevent stretching
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // 3. Update renderer size
  renderer.setSize(width, height);
  
  // 4. Update pixel ratio for high-DPI screens (optional but recommended)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gizmo.update();
}

function update_select_marker(){
  if(marker){
    const transform2d = PARAMS.transform2d.find(e => e.entityId === PARAMS.entityId);
    if(transform2d){
      const worldPos = transformPoint(transform2d.worldMatrix, 0, 0);
      let worldRotation = getRotationFromMatrix(transform2d.worldMatrix)
      let worldScale = getScaleFromMatrix(transform2d.worldMatrix)

      // worldRotation = row.rotation;
      marker.position.set(worldPos.x, worldPos.y, 0);
      marker.rotation.z = worldRotation;
      // marker.scale.set(worldScale.x, worldScale.y, 1);
      marker.visible = true;
    }else{
      marker.visible = false;
    }
  }
}

function animate() {
  if(orbitControls){
    orbitControls.update();
  }
  update_select_marker();
  renderer.render(scene, camera);
  gizmo.render();
  requestAnimationFrame(animate);
}

setup_three();

// van.add(document.body, windowLogin())
van.add(document.body, App())
//-----------------------------------------------
// TWEAKPANE
//-----------------------------------------------
const pane = new Pane();
//-----------------------------------------------
// ENTITY
//-----------------------------------------------
const entityFolder = pane.addFolder({
  title: 'Entity',
});
entityFolder.addButton({title: 'Create'}).on('click',()=>{
  conn.reducers.createEntity({})
});
deleteEntityBinding = entityFolder.addButton({title: 'Delete Entity'}).on('click',()=>{
  try {
    if(PARAMS.entityId !== "" ){
      conn.reducers.deleteEntity({
        entityId:PARAMS.entityId
      });
    }
  } catch (error) {
    console.log("delete entity error!");
  }
})
entityFolder.addButton({title: 'Entities Logs'}).on('click',()=>{
  console.log(PARAMS.entities);
});
deleteEntityBinding.disabled = true;

let entitiesBinding;

function update_entities_list(){
  let entitiesOptions = [];
  if(entitiesBinding) entitiesBinding.dispose();
  for(const ent of PARAMS.entities){
    entitiesOptions.push({
      text:ent.id,
      value:ent.id,
    })
  }
  entitiesBinding = entityFolder.addBlade({
    view: 'list',
    label: 'Select Entity:',
    options: entitiesOptions,
    value: '',
  }).on('change',(event)=>{
    selectEntity(event.value)
    // console.log(event.value);
    // PARAMS.entityId = event.value;
  });
}

function selectEntity(id){
  const entity = PARAMS.entities.find(e => e.id === id);
  if(!entity) return;
  PARAMS.entityId = id;
  // entityLogBinding.disabled = false;
  deleteEntityBinding.disabled = false;

  // console.log(entity);

  const _transform2d = PARAMS.transform2d.find(e => e.entityId === id);
  if(_transform2d){
    const worldPos = transformPoint(_transform2d.localMatrix, 0, 0);
    let worldRotation = getRotationFromMatrix(_transform2d.localMatrix)
    let worldScale = getScaleFromMatrix(_transform2d.localMatrix)

    PARAMS.t2_position.x = worldPos.x;
    PARAMS.t2_position.y = worldPos.y;
    // PARAMS.t2_rotation = radiansToDegree(worldRotation);
    console.log("worldRotation:", worldRotation);
    PARAMS.t2_rotation = worldRotation;
    PARAMS.t2_scale.x = worldScale.x;
    PARAMS.t2_scale.y = worldScale.y;

    if(position2DBinding) position2DBinding.refresh()
    if(rotation2DBinding) rotation2DBinding.refresh()
    if(scale2DBinding) scale2DBinding.refresh()
    if(addTransform2DBinding)addTransform2DBinding.disabled = true;
    if(removeTransform2DBinding)removeTransform2DBinding.disabled = false;

  }else{
    if(addTransform2DBinding)addTransform2DBinding.disabled = false;
    if(removeTransform2DBinding)removeTransform2DBinding.disabled = true;
  }
  if(update_transform2d_parent) update_transform2d_parent();
}

update_entities_list();

//-----------------------------------------------
// TRANSFORM 2D
//-----------------------------------------------
let transform2DFolder = pane.addFolder({
  title: 'Transform 2D',
});
addTransform2DBinding = transform2DFolder.addButton({title:'Add Transform 2D'}).on('click',()=>{
  conn.reducers.addEntityTransform2D({
    entityId:PARAMS.entityId
  });
})
removeTransform2DBinding = transform2DFolder.addButton({title:'Remove Transform 2D'}).on('click',()=>{
  conn.reducers.removeEntityTransform2D({
    entityId:PARAMS.entityId
  });
})
transform2DFolder.addButton({title:'Transform 2D Log'})

let t2dhierarchyFolder = pane.addFolder({
  title: 'Transform 2D Hierarchy',
});

t2dhierarchyFolder.addButton({title:'Refresh'}).on('click',()=>{
  update_transform2d_parent();
})

hierarchyParentBinding = t2dhierarchyFolder.addBlade({
  view: 'list',
  label: 'Parent:',
  options: [
    {text:"None", value:""}
  ],
  value: '',
}).on('change',(event)=>{
  // selectEntity2D(event.value)
  console.log(event.value);
  // PARAMS.entityId = event.value;
});

function update_transform2d_parent(){
  if(hierarchyParentBinding) hierarchyParentBinding.dispose();

  let parentOptions = [];
  parentOptions.push({
    text:"None", value:""
  });
  for(const _transform2d of PARAMS.transform2d){
    if(_transform2d.entityId != PARAMS.entityId){
      parentOptions.push({text:_transform2d.entityId, value:_transform2d.entityId
    });
    }
  }
  let _parent = "";
  const _transform = PARAMS.transform2d.find(r=>r.entityId == PARAMS.entityId)
  if(_transform && _transform.parentId != ""){
    _parent = _transform.parentId;
  }
  // console.log(parentOptions);
  hierarchyParentBinding = t2dhierarchyFolder.addBlade({
  view: 'list',
  label: 'Parent:',
  options: parentOptions,
  value: _parent,
  }).on('change',(event)=>{
    // selectEntity2D(event.value)
    console.log(event.value);
    // PARAMS.entityId = event.value;
    set_transform2d_parent(event.value);
  });
}

function set_transform2d_parent(id){
  conn.reducers.setTransform2DParent({
    entityId:PARAMS.entityId,
    parentId:id // parentId
  })
}

let transform2DPropsFolder = pane.addFolder({
  title: 'Transform 2D Props',
});

position2DBinding = transform2DPropsFolder.addBinding(PARAMS, 't2_position').on('change',()=>{
  // console.log("change position")
  // conn.reducers.setTransform2DPosition({
  //   entityId:PARAMS.entityId,
  //   x:PARAMS.t2_position.x,
  //   y:PARAMS.t2_position.y
  // });

  conn.reducers.setTransform2D({
    entityId:PARAMS.entityId,
    position:PARAMS.t2_position,
    rotation:PARAMS.t2_rotation,
    scale:PARAMS.t2_scale,
  });
  // conn.reducers.updateAllTransform2D();
})
rotation2DBinding = transform2DPropsFolder.addBinding(PARAMS, 't2_rotation').on('change',()=>{
  // conn.reducers.setTransform2DRotation({
  //   entityId:PARAMS.entityId,
  //   rotation: PARAMS.t2_rotation
  // });

  conn.reducers.setTransform2D({
    entityId:PARAMS.entityId,
    position:PARAMS.t2_position,
    rotation:PARAMS.t2_rotation,
    scale:PARAMS.t2_scale,
  });
  // conn.reducers.updateAllTransform2D();
})
scale2DBinding = transform2DPropsFolder.addBinding(PARAMS, 't2_scale').on('change',()=>{
  // conn.reducers.setTransform2DScale({
  //   entityId:PARAMS.entityId,
  //   x:PARAMS.t2_scale.x,
  //   y:PARAMS.t2_scale.y
  // })
  // conn.reducers.updateAllTransform2D();

  conn.reducers.setTransform2D({
    entityId:PARAMS.entityId,
    position:PARAMS.t2_position,
    rotation:PARAMS.t2_rotation,
    scale:PARAMS.t2_scale,
  });


})
//-----------------------------------------------
// TEST
//-----------------------------------------------
const testFolder = pane.addFolder({
  title: 'Test',
});

testFolder.addButton({title:'transform list'}).on('click',()=>{
  console.log(PARAMS.transform2d);
})

testFolder.addButton({title:'clear transforms'}).on('click',()=>{
  conn.reducers.clearAllTransforms();
})

testFolder.addButton({title:'get transform2d parent id'}).on('click', async ()=>{
  let _parentId = await conn.procedures.getTransform2DParentId({
    entityId:PARAMS.entityId
  });
  console.log("Parent Id:", _parentId)
})

testFolder.addButton({title:'get transform2d local position'}).on('click', async ()=>{
  let pos = await conn.procedures.getLocalPosition2D({
    entityId:PARAMS.entityId
  });
  console.log("pos:", pos)
})

testFolder.addButton({title:'get transform2d local rotation'}).on('click', async ()=>{
  let rot = await conn.procedures.getLocalRotation2D({
    entityId:PARAMS.entityId
  });
  console.log("rot:", rot)
})

testFolder.addButton({title:'get transform2d local scale'}).on('click', async ()=>{
  let scale = await conn.procedures.getLocalScale2D({
    entityId:PARAMS.entityId
  });
  console.log("scale:", scale)
})

testFolder.addButton({title:'get transform2d world position'}).on('click', async ()=>{
  let pos = await conn.procedures.getWorldPosition2D({
    entityId:PARAMS.entityId
  });
  console.log("pos:", pos)
})

testFolder.addButton({title:'get transform2d world rotation'}).on('click', async ()=>{
  let rot = await conn.procedures.getWorldRotation2D({
    entityId:PARAMS.entityId
  });
  console.log("rot:", rot)
})

testFolder.addButton({title:'get transform2d world scale'}).on('click', async ()=>{
  let scale = await conn.procedures.getWorldScale2D({
    entityId:PARAMS.entityId
  });
  console.log("scale:", scale)
});

testFolder.addButton({title:'get local transform2d'}).on('click', async ()=>{
  let t2d = await conn.procedures.getLocalTransform2D({
    entityId:PARAMS.entityId
  });
  console.log("getLocalTransform2D:", t2d)
});

testFolder.addButton({title:'get world transform2d'}).on('click', async ()=>{
  let t2d = await conn.procedures.getWorldTransform2D({
    entityId:PARAMS.entityId
  });
  console.log("getWorldTransform2D:", t2d)
});