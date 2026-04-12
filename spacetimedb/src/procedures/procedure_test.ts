//-----------------------------------------------
//
//-----------------------------------------------
// https://spacetimedb.com/docs/functions/procedures
import { table, t } from 'spacetimedb/server';
import spacetimedb from "../module";
//-----------------------------------------------
// 
//-----------------------------------------------
const test_unit = spacetimedb.procedure(t.unit(), ctx => {
  // 
  return {};
});
//-----------------------------------------------
// 
//-----------------------------------------------
// Define a reducer and save the reference
export const processItem = spacetimedb.reducer({ itemId: t.u64() }, (ctx, { itemId }) => {
  // ... reducer logic
});
export const fetch_and_process = spacetimedb.procedure({ url: t.string() }, t.unit(), (ctx, { url }) => {
  // Fetch external data
  const response = ctx.http.fetch(url);
  const data = response.json();

  // Call the reducer within a transaction
  ctx.withTx(txCtx => {
    // processItem(txCtx, { itemId: data.id });
  });

  return {};
});


