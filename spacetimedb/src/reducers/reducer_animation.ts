
import { ScheduleAt } from 'spacetimedb';
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { transform2dAnimation } from '../tables/table_animation';

// @ts-ignore
export const update_transform3d_animation = spacetimedb.reducer({ 
  arg: transform2dAnimation.rowType 
},(ctx, { arg }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id
  console.log("update...");
  console.log("transform2d counts:", ctx.db.transform2d.count())
});


export const start_transform2d_animation = spacetimedb.reducer({  }, (ctx, {  }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id
  console.log("start.");

  if(ctx.db.transform2dAnimation.count() == 0n){
    // Schedule to run every 1 seconds (1,000,000 microseconds)
    ctx.db.transform2dAnimation.insert({
      scheduled_id: 0n,
      scheduled_at: ScheduleAt.interval(1_000_000n),
      message: undefined
    });
  }
});

export const stop_transform2d_animation = spacetimedb.reducer({  }, (ctx, {  }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id
  console.log("stop.");

  for(const t2dAnimation of ctx.db.transform2dAnimation.iter()){
    ctx.db.transform2dAnimation.scheduled_id.delete(t2dAnimation.scheduled_id);
  }

});