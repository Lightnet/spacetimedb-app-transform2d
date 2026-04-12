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
    update_all_transform2d(ctx,{});
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
    update_all_transform2d(ctx,{});
  }
});
//-----------------------------------------------
// SET TRANSFORM 2D SCALE
//-----------------------------------------------
export const set_transform2d_scale = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64()}, 
  (ctx, { entityId, x, y}) => {
  const t2d = ctx.db.transform2d.entityId.find(entityId);
  if(t2d){
    console.log("update position2d");
    t2d.scale.x = x;
    t2d.scale.y = y;
    t2d.localMatrix  = computeLocal2DMatrix(t2d);
    t2d.isDirty = true;
    ctx.db.transform2d.entityId.update(t2d)
    markSubtreeDirty2D(ctx, entityId);
    update_all_transform2d(ctx,{});
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
// 
//-----------------------------------------------
// Returns identity matrix if no parent or parent not found
// function getParentWorldMatrix(ctx: any, parentId: string | undefined): Matrix2D {
//   if (!parentId) return identity;

//   const parent = ctx.db.transform2d.entityId.find(parentId);
//   return parent ? parent.worldMatrix : identity;
// }

function getParentWorldMatrix(dbCtx: any, parentId: string | undefined ): Matrix2D {
  if (!parentId) return identity;

  const parent = dbCtx.db.transform2d.entityId.find(parentId);
  return parent?.worldMatrix ?? identity;   // ← safe fallback
}



// Main propagation function (BFS topological update)
function updateTransformHierarchy2D(ctx: any) {
  const dirtyRoots: string[] = [];
  const visited = new Set<string>();

  // Step 1: Collect all dirty roots (transforms with no parent or whose parent is not dirty)
  for (const t of ctx.db.transform2d.iter()) {
    if (!t.isDirty) continue;

    const hasDirtyParent = t.parentId && 
      ctx.db.transform2d.entityId.find(t.parentId)?.isDirty === true;

    if (!t.parentId || !hasDirtyParent) {
      dirtyRoots.push(t.entityId);
    }
  }

  // Step 2: BFS from dirty roots — process level by level
  const queue = [...dirtyRoots];
  console.log("dirtyRoots: ",queue.length)
  while (queue.length > 0) {
    const entityId = queue.shift()!;
    if (visited.has(entityId)) continue;
    visited.add(entityId);

    const t2d = ctx.db.transform2d.entityId.find(entityId);
    if (!t2d) continue;

    // Recompute localMatrix if needed (in case position/rotation/scale changed)
    if (t2d.isDirty) {
      t2d.localMatrix = computeLocal2DMatrix(t2d);
    }

    // Compute worldMatrix = parentWorld * localMatrix
    const parentWorld = getParentWorldMatrix(ctx, t2d.parentId);
    t2d.worldMatrix = multiply2D(parentWorld, t2d.localMatrix);

    // Clear dirty flag
    t2d.isDirty = false;
    ctx.db.transform2d.entityId.update(t2d);

    // Enqueue direct children
    for (const child of ctx.db.transform2d.iter()) {
      if (child.parentId === entityId && !visited.has(child.entityId)) {
        queue.push(child.entityId);
      }
    }
  }
}
//-----------------------------------------------
// UPDATE ALL TRANSFORM 2D (HIERARCHY PROPAGATION)
//-----------------------------------------------
export const update_all_transform2d = spacetimedb.reducer((ctx) => {
  console.log("Running full 2D hierarchy update");
  updateTransformHierarchy2D(ctx);
});


//-----------------------------------------------
// GET WORLD POSITION 2D (as Procedure - Read-only)
//-----------------------------------------------

// Return type definition
type WorldPosition2D = { x: number; y: number };

// Helper to extract position from a worldMatrix (last column)
// function extractPositionFromMatrix(worldMatrix: Matrix2D): { x: number; y: number } {
//   return {
//     x: worldMatrix[2],  // translation x (row-major: index 2)
//     y: worldMatrix[5],  // translation y (index 5)
//   };
// }

// Helper to safely get parent world matrix
// function getParentWorldMatrix(dbCtx: any, parentId: string | undefined | null): Matrix2D {
//   if (!parentId) return identity;

//   const parent = dbCtx.db.transform2d.entityId.find(parentId);
//   return parent?.worldMatrix ?? identity;   // ← safe fallback
// }

// Extract {x, y} from worldMatrix (translation is at indices 2 and 5 in row-major 3x3)
function extractPositionFromMatrix(mat: Matrix2D): { x: number; y: number } {
  return { x: mat[2], y: mat[5] };
}

const WorldPosition2D = t.object('WorldPosition2D', {
  x: t.f64(),
  y: t.f64()
})

// Main procedure - uses withTx for safe read access
//-----------------------------------------------
// GET WORLD POSITION 2D - PROCEDURE
//-----------------------------------------------
export const get_world_position_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( WorldPosition2D ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t = tx.db.transform2d.entityId.find(entityId);
      if (!t) return undefined;

      const local = t.isDirty 
        ? computeLocal2DMatrix(t) 
        : (t.localMatrix as Matrix2D) ?? identity;

      const parentWorld = getParentWorldMatrix(tx, t.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractPositionFromMatrix(worldMat);
    });
  }
);
