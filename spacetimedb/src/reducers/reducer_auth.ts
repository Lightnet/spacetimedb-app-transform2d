//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { validateName } from '../helper';
//-----------------------------------------------
// 
//-----------------------------------------------
export const auth_login = spacetimedb.reducer(
  { alias: t.string(), pass: t.string() }, (ctx, { alias, pass }) => {
  console.log("alias", alias);
  console.log("pass", pass);
  validateName(alias);
  const _userAuth = ctx.db.userAuth.alias.find(alias)
  console.log(_userAuth);
  if (!_userAuth) {
    throw new SenderError('Does not exist user!');
  }

  const _user = ctx.db.users.id.find(_userAuth.userId)
  if(_user){
    _user.online=true;
    _user.identity = ctx.identity;
    ctx.db.users.id.update(_user)

    _userAuth.identity = ctx.identity;
    ctx.db.userAuth.userId.update(_userAuth)
    console.log("update user");
  }
  // ctx.db.user.id.update({ ...user, name:alias });
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const auth_register = spacetimedb.reducer(
  { alias: t.string(), pass: t.string() }, (ctx, { alias, pass }) => {
  console.log("alias", alias);
  console.log("pass", pass);
  validateName(alias);

  const user = ctx.db.userAuth.alias.find(alias);
  console.log("user: ", user)

  if(user){
    throw new SenderError("User Exist!");
  }else{
    console.log("create user!");
    const uuid = ctx.newUuidV7().toString();

    ctx.db.userAuth.insert({
      identity: ctx.identity,
      userId: uuid,
      isValid: false,
      alias: alias,
      pass: pass
    });

    ctx.db.users.insert({
      identity: ctx.identity,
      name: alias,
      id: uuid,
      online: true
    });
  }

});
//-----------------------------------------------
// 
//-----------------------------------------------
export const auth_logout = spacetimedb.reducer(
  { alias: t.string(), pass: t.string() }, (ctx, { alias, pass }) => {
  console.log("alias", alias);
  console.log("pass", pass);
  validateName(alias);

  const session = ctx.db.sessions.identity.find(ctx.sender);
  if(!session) return;
  if(!session.userId) return;

  const _userAuth = ctx.db.userAuth.userId.find(session.userId);
  console.log("_userAuth: ", _userAuth)

  if(_userAuth){
    const _user = ctx.db.users.id.find(_userAuth.userId);
    if(_user){
      // remove identity token
      _user.identity = undefined;
      _user.online = false;
      ctx.db.users.id.update(_user)
      _userAuth.identity = undefined;
      ctx.db.userAuth.userId.update(_userAuth)
    }
    // throw new SenderError("User Exist!");
  }else{
    console.log("[ logout ]Not found user!");
  }

});