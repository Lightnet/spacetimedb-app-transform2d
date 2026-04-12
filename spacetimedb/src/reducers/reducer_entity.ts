//-----------------------------------------------
// REDUCER ENTITY
//-----------------------------------------------
// import { Quaternion, Euler } from 'three';
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
// import { degreeToRadians } from '../helper';
// import * as THREE from 'three';

//-----------------------------------------------
// CREATE ENTITY
//-----------------------------------------------
export const create_entity = spacetimedb.reducer({}, 
  (ctx,{}) => {
    ctx.db.entity.insert({
      id: ctx.newUuidV7().toString()
    });
});
//-----------------------------------------------
// DELETE ENTITY
//-----------------------------------------------
export const delete_entity = spacetimedb.reducer({entityId:t.string()}, 
  (ctx,{entityId}) => {
  // need to check transform
  ctx.db.entity.id.delete(entityId);
  ctx.db.transform2d.entityId.delete(entityId);
});

//-----------------------------------------------
//  TRANSFORM 2D
//-----------------------------------------------

//-----------------------------------------------
// ADD ENTITY TRANSFORM 2D
//-----------------------------------------------
export const add_entity_transform2d = spacetimedb.reducer(
  { entityId: t.string() }, 
  (ctx, { entityId }) => {
  const _transform2d = ctx.db.transform2d.entityId.find(entityId);
  console.log("transform: ", _transform2d)
  if(!_transform2d){
    console.log("add transform 2d");
    ctx.db.transform2d.insert({
      position: { x: 0, y: 0},
      rotation: 0,
      scale: { x: 1, y: 1 },
      entityId: entityId,
      parentId: "",
      isDirty: true,
      localMatrix: [
        1, 0, 0, // Column 1 (X-axis)
        0, 1, 0, // Column 2 (Y-axis)
        0, 0, 1  // Column 3 (Translation/Homogeneous)
      ],
      worldMatrix: [
        1, 0, 0, // Column 1 (X-axis)
        0, 1, 0, // Column 2 (Y-axis)
        0, 0, 1  // Column 3 (Translation/Homogeneous)
      ],
    });
  }
});

//-----------------------------------------------
// REMOVE ENTITY TRANSFORM 2D
//-----------------------------------------------
export const remove_entity_transform2d = spacetimedb.reducer(
  { entityId: t.string() }, 
  (ctx, { entityId }) => {
    ctx.db.transform2d.entityId.delete(entityId);
    console.log("delete transform2d id:", entityId)
});
//-----------------------------------------------
// SET TRANSFORM 2D PARENT
//-----------------------------------------------
export const set_transform2d_parent = spacetimedb.reducer(
  { entityId: t.string(), parentId: t.string() }, 
  (ctx, { entityId, parentId }) => {
    const child = ctx.db.transform2d.entityId.find(entityId);
    if (!child) return;

    const parent = ctx.db.transform2d.entityId.find(parentId);
    child.parentId = parent ? parentId : undefined;

    child.isDirty = true;                    // ← add this
    ctx.db.transform2d.entityId.update(child);
    markSubtreeDirty2D(ctx, entityId);       // ← add this
  });
//-----------------------------------------------
// MATH
//-----------------------------------------------
// Matrix is now stored as a flat array: [a, b, c, d, e, f, 0, 0, 1]  (row-major, 3x3)
type Matrix2D = [number, number, number, number, number, number, number, number, number];
const identity: Matrix2D = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function translate2D(x: number, y: number): Matrix2D {
  return [1, 0, x, 0, 1, y, 0, 0, 1];
}

function rotate2D(angleDeg: number): Matrix2D {
  const rad = angleDeg * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function scale2D(sx: number, sy: number): Matrix2D {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

// Helper to multiply two 3x3 row-major matrices: C = A * B
// function multiply2D(a: Matrix2D, b: Matrix2D): Matrix2D {
//   const r: Matrix2D = [0,0,0, 0,0,0, 0,0,0];
//   for (let i = 0; i < 3; i++) {
//     for (let j = 0; j < 3; j++) {
//       for (let k = 0; k < 3; k++) {
//         r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
//       }
//     }
//   }
//   return r;
// }
function multiply2D(a: Matrix2D, b: Matrix2D): Matrix2D {
  return [
    a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
    a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
    a[0]*b[2] + a[1]*b[5] + a[2]*b[8],

    a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
    a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
    a[3]*b[2] + a[4]*b[5] + a[5]*b[8],

    a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
    a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
    a[6]*b[2] + a[7]*b[5] + a[8]*b[8],
  ];
}



// Correct composition for proper orbiting:
// Scale → Rotate → Translate  (this is the most common correct order)
// function computeLocal2DMatrix(t: any): Matrix2D {
//   const scaleMat = scale2D(t.scale.x, t.scale.y);
//   const rotateMat = rotate2D(t.rotation);
//   const translateMat = translate2D(t.position.x, t.position.y);
//   // SRT order: Scale → Rotate → Translate
//   return multiply2D(translateMat, multiply2D(rotateMat, scaleMat));
// }

function computeLocal2DMatrix(t: any): Matrix2D {
  const scaleMat   = scale2D(t.scale.x, t.scale.y);
  const rotateMat  = rotate2D(t.rotation);
  const translateMat = translate2D(t.position.x, t.position.y);

  // SRT order: Scale first, then Rotate, then Translate  →  T * R * S
  return multiply2D(translateMat, multiply2D(rotateMat, scaleMat));
}

// Efficient BFS version - marks entire subtree dirty when parent changes
function markSubtreeDirty2D(ctx: any, rootEntityId: string) {
  const toMark: string[] = [rootEntityId];
  const visited = new Set<string>();

  while (toMark.length > 0) {
    const entityId = toMark.shift()!;
    if (visited.has(entityId)) continue;
    visited.add(entityId);

    const transform = ctx.db.transform2d.entityId.find(entityId);
    if (transform) {
      if (!transform.isDirty) {
        transform.isDirty = true;
        ctx.db.transform2d.entityId.update(transform);
      }
    }

    // Find direct children and queue them
    for (const child of ctx.db.transform2d.iter()) {
      if (child.parentId === entityId && !visited.has(child.entityId)) {
        toMark.push(child.entityId);
      }
    }
  }
};

//-----------------------------------------------
// SET TRANSFORM 2D POSITION
//-----------------------------------------------
export const set_transform2d_position = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64()}, 
  (ctx, { entityId, x, y}) => {
  const t2d = ctx.db.transform2d.entityId.find(entityId);
  if(t2d){
    console.log("update position2d");
    t2d.position.x = x;
    t2d.position.y = y;
    t2d.localMatrix  = computeLocal2DMatrix(t2d);
    t2d.isDirty = true;
    ctx.db.transform2d.entityId.update(t2d);
    markSubtreeDirty2D(ctx, entityId);
    // _transform2d.worldMatrix = localMatrix;
    // console.log(_transform2d.position)
    
  }
});
//-----------------------------------------------
// SET TRANSFORM 2D ROTATION
//-----------------------------------------------
export const set_transform2d_rotation = spacetimedb.reducer(
  { entityId: t.string(), rotation:t.f64()}, 
  (ctx, { entityId, rotation}) => {
  const t2d = ctx.db.transform2d.entityId.find(entityId);
  if(t2d){
    console.log("update position2d");
    t2d.rotation = rotation;
    t2d.localMatrix = computeLocal2DMatrix(t2d);
    t2d.isDirty = true;
    ctx.db.transform2d.entityId.update(t2d);
    markSubtreeDirty2D(ctx, entityId);
    // update_all_transform2d(ctx,{});
  }
});
//-----------------------------------------------
// SET TRANSFORM 2D SCALE
//-----------------------------------------------
export const set_transform2d_scale = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64()}, 
  (ctx, { entityId, x, y}) => {
  const _transform2d = ctx.db.transform2d.entityId.find(entityId);
  if(_transform2d){
    console.log("update position2d");
    _transform2d.scale.x = x;
    _transform2d.scale.y = y;
    _transform2d.localMatrix  = computeLocal2DMatrix(_transform2d);
    _transform2d.isDirty = true;
    ctx.db.transform2d.entityId.update(_transform2d)
    markSubtreeDirty2D(ctx, entityId);
    // update_all_transform2d(ctx,{});
    // _transform2d.worldMatrix = localMatrix;
  }
});
//-----------------------------------------------
// CLEAR ALL TRANSFORM 2D AND 3D
//-----------------------------------------------
export const clear_all_transforms = spacetimedb.reducer((ctx) => {
  for(const _transform2d of ctx.db.transform2d.iter()){
    if(_transform2d){
      ctx.db.transform2d.entityId.delete(_transform2d.entityId)
    }
  }
});
//-----------------------------------------------
// update all transform2d
//-----------------------------------------------

//-----------------------------------------------
// update all transform2d (HIERARCHY PROPAGATION)
//-----------------------------------------------
export const update_all_transform2d = spacetimedb.reducer((ctx) => {
  console.log("=== Starting transform update ===");

  const transforms = new Map<string, any>();
  const dirtyIds = new Set<string>();

  // First pass: cache everything
  for (const t of ctx.db.transform2d.iter()) {
    transforms.set(t.entityId, { ...t }); // shallow copy to avoid mutation issues
    if (t.isDirty) dirtyIds.add(t.entityId);
  }

  if (dirtyIds.size === 0) {
    console.log("No dirty transforms");
    return;
  }

  // Build children map once (much faster than repeated iter())
  const childrenMap = new Map<string, string[]>();
  for (const [id, t] of transforms) {
    if (t.parentId) {
      if (!childrenMap.has(t.parentId)) childrenMap.set(t.parentId, []);
      childrenMap.get(t.parentId)!.push(id);
    }
  }

  // Queue: start with dirty nodes that have no dirty parent (roots of dirty subtrees)
  const queue: string[] = [];
  for (const id of dirtyIds) {
    const t = transforms.get(id)!;
    const parentDirty = t.parentId && dirtyIds.has(t.parentId);
    if (!parentDirty) {
      queue.push(id);
    }
  }

  let processed = 0;

  while (queue.length > 0) {
    const entityId = queue.shift()!;
    const transform = transforms.get(entityId);
    if (!transform) continue;

    let worldMat: Matrix2D;

    if (!transform.parentId) {
      worldMat = [...(transform.localMatrix as Matrix2D)];
    } else {
      const parent = transforms.get(transform.parentId);
      if (parent?.worldMatrix) {
        worldMat = multiply2D(parent.worldMatrix as Matrix2D, transform.localMatrix as Matrix2D);
      } else {
        worldMat = [...(transform.localMatrix as Matrix2D)];
      }
    }

    // Write back
    const dbTransform = ctx.db.transform2d.entityId.find(entityId);
    if (dbTransform) {
      dbTransform.worldMatrix = worldMat;
      dbTransform.isDirty = false;
      ctx.db.transform2d.entityId.update(dbTransform);
    }

    processed++;

    // Enqueue dirty children
    const children = childrenMap.get(entityId) || [];
    for (const childId of children) {
      if (dirtyIds.has(childId)) {
        queue.push(childId);
      }
    }
  }

  console.log(`Updated ${processed} transforms`);
});