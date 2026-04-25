import { dbEntities, stateConn } from '../context';
import { DbConnection, tables } from '../module_bindings';

function addOrUpdateEntity(ent) {
  if (!ent || !ent.id) return;
  const currentMap = dbEntities.val;        // get current
  const newMap = new Map(currentMap);           // create copy
  newMap.set(ent.id, ent);
  dbEntities.val = newMap;                  // assign new Map → triggers update
}

function deleteEntity(id) {
  if (!id) return;
  // Create new Map without the item
  const newMap = new Map(dbEntities.val);
  newMap.delete(id);
  // Update the state (this is what makes VanJS detect the change)
  dbEntities.val = newMap;
}

function onInsert_Entity(_ctx, row){
  // console.log(row);
  addOrUpdateEntity(row);
}

function onDelete_Entity(_ctx, row){
  deleteEntity(row.id)
}

export function setupDBEntity(){
  // console.log(connState.val)
  const conn = stateConn.val;
  conn.subscriptionBuilder()
      .subscribe(tables.entity);
    conn.db.entity.onInsert(onInsert_Entity);
    conn.db.entity.onDelete(onDelete_Entity);
}