
import { Application, Graphics, Container } from 'pixi.js';
import { statePixi, stateWorld, stateZoomLevel } from './context';

let zoomLevel = 1;
const zoomSpeed = 0.1;   // adjust for sensitivity
const minZoom = 0.2;
const maxZoom = 5.0;


export async function initPixi() {
  // 1. Create and initialize a PixiJS application
  const app = new Application();
  await app.init({ 
    backgroundColor: 0x1099bb,
    // width: 800, 
    // height: 600,  
    resizeTo: window
  });
  statePixi.val = app;

  document.body.appendChild(app.canvas);

  const world = new Container(); //camera
  app.stage.addChild(world);
  stateWorld.val = world;

  // Mouse wheel zoom (centered on screen, not mouse)
  app.canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // prevent page scroll
    let zoomLevel = stateZoomLevel.val;
    console.log(zoomLevel);

    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed; // scroll down = zoom out

    zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));

    stateZoomLevel.val = zoomLevel;

    // Apply zoom to the world container (your "camera")
    stateWorld.val.scale.set(zoomLevel, zoomLevel);
  });


  // 2. Create a Graphics object
  // const rectangle = new Graphics()
  //   .rect(0, 0, 50, 50) // x, y, width, height
  //   .fill(0xDE3249)         // Set fill color
  //   .stroke({ width: 2, color: 0xffffff }); // Optional border
  // rectangle.pivot.set(25, 25);
  // console.log(rectangle);

  // 3. Add it to the stage
  // app.stage.addChild(rectangle);
  // world.addChild(rectangle);
  // let target = rectangle;

  // const rectangle2 = new Graphics()
  //   .rect(0, 0, 50, 50) // x, y, width, height
  //   .fill(0xDE3249)         // Set fill color
  //   .stroke({ width: 2, color: 0xffffff }); // Optional border
  // world.addChild(rectangle2);

  // 3. To "move the camera" right, move the world left
  //world.x -= 2; 

  // Alternatively: Follow a target by moving the world's pivot
  // world.pivot.set(target.x, target.y);
  // world.position.set(app.screen.width / 2, app.screen.height / 2);

  world.position.set(app.screen.width / 2, app.screen.height / 2);

  // Listen for animate update
  app.ticker.add((time) => {
    // rectangle.rotation += 0.01;
    // console.log("update...");
  });


}