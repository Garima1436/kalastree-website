-- Optional video link for a News & Events entry (YouTube/Vimeo URL or a
-- direct video link) — a link field, not an uploaded file, to avoid
-- Supabase Storage bandwidth/size costs for large video uploads.
alter table news_events add column if not exists video_url text;
