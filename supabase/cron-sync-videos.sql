create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('sync-videos')
where exists (select 1 from cron.job where jobname = 'sync-videos');

select cron.schedule(
  'sync-videos',
'7-59/15 * * * *',
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
