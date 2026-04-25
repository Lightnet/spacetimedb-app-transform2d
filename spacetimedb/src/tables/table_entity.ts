//-----------------------------------------------
// TABLE ENTITY
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
//-----------------------------------------------
// table: entity
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