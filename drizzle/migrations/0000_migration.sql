create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- first account becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id, 'user');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_first_admin();

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token_hash text,
  pairing_code_hash text,
  pairing_expires_at timestamptz,
  can_transcribe boolean not null default true,
  can_control boolean not null default true,
  revoked_at timestamptz,
  paired_at timestamptz,
  last_seen_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.devices to authenticated;
grant all on public.devices to service_role;
alter table public.devices enable row level security;
create policy "admins manage devices" on public.devices for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.celebrations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  celebration_type text not null default 'Messe',
  status text not null default 'live',
  source_lang text not null default 'fr',
  controller_device_id uuid,
  controller_user_id uuid,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary jsonb,
  summary_status text not null default 'none',
  bible_refs text[] not null default '{}',
  created_at timestamptz not null default now()
);
create unique index one_active_celebration on public.celebrations ((true)) where status in ('live','paused');
grant select on public.celebrations to anon, authenticated;
grant insert, update, delete on public.celebrations to authenticated;
grant all on public.celebrations to service_role;
alter table public.celebrations enable row level security;
create policy "public read celebrations" on public.celebrations for select to anon, authenticated using (true);
create policy "admins write celebrations" on public.celebrations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  celebration_id uuid not null references public.celebrations(id) on delete cascade,
  seq int not null,
  text text not null,
  text_fr text,
  text_ar text,
  created_at timestamptz not null default now()
);
create index on public.segments(celebration_id, seq);
grant select on public.segments to anon, authenticated;
grant insert, update, delete on public.segments to authenticated;
grant all on public.segments to service_role;
alter table public.segments enable row level security;
create policy "public read segments" on public.segments for select to anon, authenticated using (true);
create policy "admins write segments" on public.segments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'Messe',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  description text,
  created_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "public read events" on public.events for select to anon, authenticated using (true);
create policy "admins write events" on public.events for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "admins read audit" on public.audit_log for select to authenticated using (public.has_role(auth.uid(),'admin'));

alter publication supabase_realtime add table public.segments;
alter publication supabase_realtime add table public.celebrations;

-- Demo data
with c as (
  insert into public.celebrations(title, celebration_type, status, started_at, ended_at, summary_status, bible_refs, summary)
  values ('Messe du 25e dimanche — Démo', 'Messe dominicale', 'ended', now() - interval '7 days', now() - interval '7 days' + interval '70 minutes', 'ready', array['Luc 15, 1-10'],
  '{"central":"Dieu ne cesse jamais de chercher celui qui s''est éloigné.","points":["Le berger laisse les 99 brebis pour chercher celle qui est perdue.","La joie du ciel pour un seul pécheur qui se convertit.","Nous sommes invités à partager ce regard de miséricorde."],"refs":["Luc 15, 1-10"],"teachings":["La miséricorde précède notre retour.","Personne n''est de trop aux yeux de Dieu."],"applications":["Renouer contact avec une personne éloignée cette semaine.","Accueillir sans juger ceux qui reviennent à la paroisse."],"conclusion":"Laissons-nous trouver par le Seigneur, et devenons à notre tour des chercheurs de frères.","uncertain":[]}'::jsonb)
  returning id
)
insert into public.segments(celebration_id, seq, text, text_fr, text_ar)
select c.id, s.seq, s.t, s.t, s.ar from c, (values
 (1,'Frères et sœurs, l''évangile de ce dimanche nous parle d''un berger qui part à la recherche de la brebis perdue.','أيها الإخوة والأخوات، يحدثنا إنجيل هذا الأحد عن راعٍ يبحث عن الخروف الضال.'),
 (2,'Dans saint Luc, au chapitre quinze, Jésus nous montre que Dieu ne se résigne jamais à perdre l''un des siens.','في إنجيل لوقا، الفصل الخامس عشر، يبيّن لنا يسوع أن الله لا يرضى أبداً بأن يخسر أحداً من خاصته.'),
 (3,'Il y a plus de joie dans le ciel pour un seul pécheur qui se convertit.','يكون فرح في السماء بخاطئ واحد يتوب.'),
 (4,'Cette semaine, osons faire le premier pas vers quelqu''un qui s''est éloigné.','هذا الأسبوع، لنجرؤ على اتخاذ الخطوة الأولى نحو من ابتعد.')
) as s(seq,t,ar);

insert into public.events(title, kind, starts_at, ends_at, location, description) values
('Messe dominicale','Messe', date_trunc('day', now()) + interval '7 days' + interval '10 hours', date_trunc('day', now()) + interval '7 days' + interval '11 hours', 'Cathédrale','Messe en français, traduction en arabe disponible.'),
('Groupe biblique','Rencontre', date_trunc('day', now()) + interval '3 days' + interval '18 hours', date_trunc('day', now()) + interval '3 days' + interval '19 hours 30 minutes', 'Salle paroissiale','Lecture de l''évangile de Luc.'),
('Chorale — répétition','Activité', date_trunc('day', now()) + interval '5 days' + interval '17 hours', null, 'Église',null),
('Fête paroissiale','Événement', date_trunc('day', now()) + interval '20 days' + interval '12 hours', null, 'Jardin du presbytère','Repas partagé et animations.');