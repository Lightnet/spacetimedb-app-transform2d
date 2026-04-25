// context

import van from "vanjs-core";

export const userIdentity = van.state(null);
export const networkStatus = van.state('Not Connected!');
export const stateConn = van.state(null);

export const dbEntities = van.state(new Map());
export const dbTransform2Ds = van.state(new Map());

// scene objects
export const objTransform2Ds = van.state(new Map());

// phaser render
export const statePhaser = van.state(null);
// pixi app
export const statePixi = van.state(null);
export const stateWorld = van.state(null);


export const stateZoomLevel = van.state(1);

export const stateZoomSpeed = van.state(0.1);
export const stateMinZoom = van.state(0.2);
export const stateMaxZoom = van.state(5.0);




