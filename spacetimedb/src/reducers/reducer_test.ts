//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
//-----------------------------------------------
// 
//-----------------------------------------------
export const test_foo = spacetimedb.reducer((ctx) => {
  console.log("bar")
});

export const test_foo2 = spacetimedb.reducer({  }, (ctx, {  }) => {
  console.log("bar")
});

export const test_auth = spacetimedb.reducer({  }, (ctx, {  }) => {
  // console.log(ctx.senderAuth)
  console.log(ctx.senderAuth.jwt)
});