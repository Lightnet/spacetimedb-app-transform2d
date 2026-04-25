//-----------------------------------------------
// TABLE ENTITY
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
//-----------------------------------------------
// table: transform2dAnimation
//-----------------------------------------------
export const transform2dAnimation = table(
  { 
    name: 'transformsecd_animation',//number bug not working using text
    public: true,
    // @ts-ignore
    scheduled: (): any => update_transform3d_animation
  },
  {

    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
    message: t.string().optional(),
  }
);

