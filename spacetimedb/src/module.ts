//-----------------------------------------------
// MODULE
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { entity, transform2d } from './tables/table_entity';
//-----------------------------------------------
// SCEHEMA
//-----------------------------------------------
const spacetimedb = schema({
  entity,
  transform2d,
});
//-----------------------------------------------
// INIT
//-----------------------------------------------
export const init = spacetimedb.init(_ctx => {
  console.log("===============INIT SPACETIMEDB APP NAME:::=========");
});
//-----------------------------------------------
// ON CLIENT CONNECT
//-----------------------------------------------
export const onConnect = spacetimedb.clientConnected(ctx => {
  // ctx.connectionId is guaranteed to be defined
  // const connId = ctx.connectionId!;
  // console.log(ctx.newUuidV7().toString())
  // ctx.timestamp;
  // Initialize client session
});
//-----------------------------------------------
// ON CLIENT DISCONNECT
//-----------------------------------------------
export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  // const connId = ctx.connectionId!;
});
//-----------------------------------------------
// 
//-----------------------------------------------
export default spacetimedb;
//-----------------------------------------------
// 
//-----------------------------------------------