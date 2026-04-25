//-----------------------------------------------
// procedure - uses withTx for safe read access
// this is return value for client and promise sync 
//-----------------------------------------------
import spacetimedb from '../module';
import { t, SenderError  } from 'spacetimedb/server';
import { Transform2DResult, Vect2 } from '../types';
import { type Matrix2D, computeLocal2DMatrix, extractPositionFromMatrix, extractRotationFromMatrix, extractScaleFromMatrix, getParentWorld2DMatrix, identity, multiply2D } from '../helper';
//-----------------------------------------------
// GET TRANSFORM2D PARENT ID
//-----------------------------------------------
export const get_transform2d_parent_id = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( t.string() ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;
      return t2d.parentId ?? undefined;
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 2D LOCAL POSITION, ROTATION AND SCALE
//-----------------------------------------------
export const get_local_transform2d = spacetimedb.procedure(
  { entityId: t.string() },
  Transform2DResult,   // reuse the same return type
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) {
        return {
          position: undefined,
          rotation: undefined,
          scale: undefined,
        };
      }

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      return {
        position: extractPositionFromMatrix(local),
        rotation: extractRotationFromMatrix(local),
        scale: extractScaleFromMatrix(local),
      };
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 2D WORLD POSITION, ROTATION AND SCALE
//-----------------------------------------------
export const get_world_transform2d = spacetimedb.procedure(
  { entityId: t.string() },
  Transform2DResult,   // ← return type
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) {
        return {
          position: undefined,
          rotation: undefined,
          scale: undefined,
        };
      }

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      const parentWorld = getParentWorld2DMatrix(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return {
        position: extractPositionFromMatrix(worldMat),
        rotation: extractRotationFromMatrix(worldMat),
        scale: extractScaleFromMatrix(worldMat),
      };
    });
  }
);
//-----------------------------------------------
// GET LOCAL POSITION 2D
//-----------------------------------------------
export const get_local_position_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( Vect2 ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      return extractPositionFromMatrix(local);
    });
  }
);
//-----------------------------------------------
// GET WORLD POSITION 2D
//-----------------------------------------------
export const get_world_position_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( Vect2 ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      const parentWorld = getParentWorld2DMatrix(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractPositionFromMatrix(worldMat);
    });
  }
);
//-----------------------------------------------
// GET LOCAL ROTATION 2D 
//-----------------------------------------------
export const get_local_rotation_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( t.f64() ),
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      return extractRotationFromMatrix(local);
    });
});
//-----------------------------------------------
// GET WORLD ROTATION 2D 
//-----------------------------------------------
export const get_world_rotation_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( t.f64() ),
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      const parentWorld = getParentWorld2DMatrix(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractRotationFromMatrix(worldMat);
    });
});
//-----------------------------------------------
// GET LOCAL SCALE 2D 
//-----------------------------------------------
export const get_local_scale_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( Vect2 ),
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      return extractScaleFromMatrix(local);
    });
});
//-----------------------------------------------
// GET WORLD SCALE 2D 
//-----------------------------------------------
export const get_world_scale_2d = spacetimedb.procedure(
  { entityId: t.string() },
  t.option( Vect2 ),
  (ctx, { entityId }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(entityId);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity;

      const parentWorld = getParentWorld2DMatrix(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractScaleFromMatrix(worldMat);
    });
});

