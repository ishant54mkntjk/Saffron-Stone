-- Run this whole script in Supabase Dashboard > SQL Editor.
-- It creates a bookings table and ensures each signed-in user can only
-- read, create, or cancel their own reservations.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 100),
  guests integer not null check (guests between 1 and 8),
  booking_date date not null,
  booking_time text not null,
  notes text not null default '' check (char_length(notes) <= 1000),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Users can view their own bookings" on public.bookings;
create policy "Users can view their own bookings"
on public.bookings for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own bookings" on public.bookings;
create policy "Users can create their own bookings"
on public.bookings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can cancel their own bookings" on public.bookings;
create policy "Users can cancel their own bookings"
on public.bookings for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on public.bookings to authenticated;
