//-----------------------------------------------
// MODULE
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { entity } from './tables/table_entity';
import { transform2d } from './tables/table_transform2d';
import { transform2dAnimation } from './tables/table_animation';
//-----------------------------------------------
// SCEHEMA
//-----------------------------------------------
const spacetimedb = schema({
  entity,
  transform2d,
  transform2dAnimation,
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