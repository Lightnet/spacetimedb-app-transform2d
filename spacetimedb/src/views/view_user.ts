//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import spacetimedb from '../module';
import { users } from '../tables/table_user';
//-----------------------------------------------
// 
//-----------------------------------------------
export const my_user = spacetimedb.view(
  { name: 'my_user', public: true },
  t.option(users.rowType),
  (ctx) => {
    const session = ctx.db.sessions.identity.find(ctx.sender);
    if(session){
      if(session.userId){
        return ctx.db.users.id.find(session.userId) ?? undefined;
      }
    }
    return undefined;
  }
);