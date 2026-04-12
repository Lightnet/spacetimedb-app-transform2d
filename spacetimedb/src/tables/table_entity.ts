//-----------------------------------------------
// TABLE ENTITY
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
//-----------------------------------------------
// ENTITY
//-----------------------------------------------
export const entity = table(
  { 
    name: 'entity', 
    public: true,
  },
  {
    id: t.string().primaryKey(),
  }
);