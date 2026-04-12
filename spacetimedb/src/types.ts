//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
//-----------------------------------------------
// 
//-----------------------------------------------
// Define a nested object type for Vector2 { x, y}
export const Vect2 = t.object('Vect2', {
  x: t.f64(),
  y: t.f64()
});