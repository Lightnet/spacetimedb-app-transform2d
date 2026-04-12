//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { validateName } from '../helper';
//-----------------------------------------------
// 
//-----------------------------------------------
export const set_name = spacetimedb.reducer({ name: t.string() }, (ctx, { name }) => {
  validateName(name);

  const session = ctx.db.sessions.identity.find(ctx.sender);

  if(session){
    if(session.userId){
      const user = ctx.db.users.id.find(session.userId);
      if (!user) {
        throw new SenderError('Cannot set name for unknown user');
      }
      ctx.db.users.id.update({ ...user, name });
    }
  }
});

