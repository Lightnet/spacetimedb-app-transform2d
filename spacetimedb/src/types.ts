//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';

// Define a nested object type for Vector2 { x, y}
// types: Vect2
export const Vect2 = t.object('Vect2', {
  x: t.f64(),
  y: t.f64()
});
// types: Transform2DResult
//-----------------------------------------------
export const Transform2DResult = t.object('Transform2DResult',{
  position: t.option(Vect2),
  rotation: t.option(t.f64()),
  scale: t.option(Vect2),
});