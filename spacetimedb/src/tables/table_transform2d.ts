//-----------------------------------------------
// TABLE TRANSFORM 2D
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import { Vect2 } from '../types';
//-----------------------------------------------
// table: transform2d
//-----------------------------------------------
export const transform2d = table(
  { 
    name: 'transform2d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    isDirty:t.bool().default(true),
    position: Vect2,
    rotation: t.f32(), // degree
    scale: Vect2,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);