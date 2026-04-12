//-----------------------------------------------
// procedure - uses withTx for safe read access
// this is return value for client and promise sync 
//-----------------------------------------------
import spacetimedb from '../module';
import { t, SenderError  } from 'spacetimedb/server';
import { Vect2 } from '../types';
import { 
  type Matrix2D, 
  computeLocal2DMatrix, 
  extractPositionFromMatrix, 
  getParentWorldMatrix, 
  identity, 
  multiply2D 
} from '../helper_transform2d';

//-----------------------------------------------
// GET WORLD POSITION 2D (as Procedure - Read-only)
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

      const parentWorld = getParentWorldMatrix(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractPositionFromMatrix(worldMat);
    });
  }
);