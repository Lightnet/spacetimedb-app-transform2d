//-----------------------------------------------
// Model tables
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
//-----------------------------------------------
// 
//-----------------------------------------------
export const loggings = table(
  { 
    name: 'loggings', 
    public: true,
  },
  {
    id: t.u64().autoInc().primaryKey(),
    event_id:t.uuid(),
    event_name:t.string(), // 'button_click', 'page_view', 'form_submit'
    event_type:t.string(), // 'click', 'view', 'input', 'error'
    properties:t.string(), // 
    created_at: t.timestamp(),
  }
);