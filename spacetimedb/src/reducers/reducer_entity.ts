//-----------------------------------------------
// REDUCER ENTITY
//-----------------------------------------------
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
//-----------------------------------------------
// reducer: create_entity
//-----------------------------------------------
export const create_entity = spacetimedb.reducer({}, 
  (ctx,{}) => {
    ctx.db.entity.insert({
      id: ctx.newUuidV7().toString()
    });
});
//-----------------------------------------------
// reducer: delete_entity
//-----------------------------------------------
export const delete_entity = spacetimedb.reducer({entityId:t.string()}, 
  (ctx,{entityId}) => {
  // need to check transform
  ctx.db.entity.id.delete(entityId);
  ctx.db.transform2d.entityId.delete(entityId);
});