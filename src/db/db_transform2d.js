// 

import { dbTransform2Ds, stateConn } from '../context';
import { DbConnection, tables } from '../module_bindings';

function addOrUpdateEntity(ent) {
  if (!ent || !ent.id) return;
  const currentMap = dbTransform2Ds.val;        // get current
  const newMap = new Map(currentMap);           // create copy
  newMap.set(ent.id, ent);
  dbTransform2Ds.val = newMap;                  // assign new Map → triggers update
}

function deleteEntity(id) {
  if (!id) return;
  // Create new Map without the item
  const newMap = new Map(dbTransform2Ds.val);
  newMap.delete(id);
  // Update the state (this is what makes VanJS detect the change)
  dbTransform2Ds.val = newMap;
}

function onInsert_Transform2Ds(_ctx, row){
  // console.log(row);
  addOrUpdateEntity(row);
}

function onUpdate_Transform2Ds(_ctx, oldRow, newRow){
  // console.log(row);
  addOrUpdateEntity(newRow);
}

function onDelete_Transform2Ds(_ctx, row){
  deleteEntity(row.id)
}

export function setupDBTransform2Ds(){
  // console.log(connState.val)
  const conn = stateConn.val;
  conn.subscriptionBuilder()
      .subscribe(tables.transform2d);

  conn.db.transform2d.onInsert(onInsert_Transform2Ds);
  conn.db.transform2d.onUpdate(onUpdate_Transform2Ds);
  conn.db.transform2d.onDelete(onDelete_Transform2Ds);
}