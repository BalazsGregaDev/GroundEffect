create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('sync-videos')
where exists (select 1 from cron.job where jobname = 'sync-videos');

select cron.schedule(
  'sync-videos',
  '11 * * * *',
  $job$
    select net.http_post(
      url := 'https://yiuwpkivbkqulrlhrsvc.supabase.co/functions/v1/sync-videos',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_arta8BkyKzh-ER3isrJ_ww_geGMGFh3',
        'x-sync-secret', 'jvDzt0pJgab2DTYvCu6jqS/PROaBukXlJvZ3mGThinQ'
      )
    );
  $job$
);

select cron.unschedule('close-expired-polls')
where exists (select 1 from cron.job where jobname = 'close-expired-polls');

select cron.schedule(
  'close-expired-polls',
  '* * * * *',
  $job$
    update polls
    set status = 'closed'
    where status = 'open' and closes_at is not null and closes_at <= now();
  $job$
);

select cron.unschedule('sync-facebook-posts')
where exists (select 1 from cron.job where jobname = 'sync-facebook-posts');

select cron.schedule(
  'sync-facebook-posts',
  '26 * * * *',
  $job$
    select net.http_post(
      url := 'https://yiuwpkivbkqulrlhrsvc.supabase.co/functions/v1/sync-facebook-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_arta8BkyKzh-ER3isrJ_ww_geGMGFh3',
        'x-sync-secret', 'jvDzt0pJgab2DTYvCu6jqS/PROaBukXlJvZ3mGThinQ'
      )
    );
  $job$
);
