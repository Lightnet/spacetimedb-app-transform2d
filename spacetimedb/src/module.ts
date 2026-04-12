//-----------------------------------------------
// MODULE
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { sessions } from './tables/table_session';
import { users, userAuth } from './tables/table_user';
import { entity, transform2d } from './tables/table_entity';
//-----------------------------------------------
// SCEHEMA
//-----------------------------------------------
const spacetimedb = schema({
  sessions,
  users,
  userAuth,
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
  const connId = ctx.connectionId!;
  // console.log(ctx.newUuidV7().toString())
  // ctx.timestamp;
  // Initialize client session
  ctx.db.sessions.insert({
    connection_id: connId,
    identity: ctx.sender,
    connected_at: ctx.timestamp,
    userId: undefined
  });
  
  // const user = ctx.db.user.identity.find(ctx.sender);
  // if (user) {
  //   ctx.db.user.id.update({ ...user, online: true });
  // } else {
  //   // ctx.db.user.insert({
  //   //   identity: ctx.sender,
  //   //   name: ctx.newUuidV7().toString(),
  //   //   online: true,
  //   //   id: ctx.newUuidV7().toString()
  //   // });
  // }

});
//-----------------------------------------------
// ON CLIENT DISCONNECT
//-----------------------------------------------
export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  const connId = ctx.connectionId!;
  const session = ctx.db.sessions.connection_id.find(connId);
  if(session){
    if(session.userId){
      const _user = ctx.db.users.id.find(session.userId)
      if(_user){

        const _userAuth = ctx.db.userAuth.userId.find(session.userId);
        if(_userAuth){
          //remove identity token in case someone use same token
          _userAuth.identity = undefined;
          _user.online = false;
          _user.identity = undefined;
        }
      }
    }
  }
  // ctx.connectionId is guaranteed to be defined
  // Clean up client session
  ctx.db.sessions.connection_id.delete(connId);
});
//-----------------------------------------------
// 
//-----------------------------------------------
export default spacetimedb;
//-----------------------------------------------
// 
//-----------------------------------------------