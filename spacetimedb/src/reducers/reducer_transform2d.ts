//-----------------------------------------------
// REDUCER TRANSFORM 2D
//-----------------------------------------------
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { computeLocal2DMatrix, getParentWorldMatrix, multiply2D } from '../helper_transform2d';
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
      rotation: 0, //degree
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

