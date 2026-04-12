//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import { SVector2 } from '../types';
//-----------------------------------------------
// 
//-----------------------------------------------
export const entity = table(
  { 
    name: 'entity', 
    public: true,
  },
  {
    id: t.string().primaryKey(),
  }
);
//-----------------------------------------------
// 
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
    position: SVector2,
    rotation: t.f32(),
    scale: SVector2,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
//-----------------------------------------------
// 
//-----------------------------------------------