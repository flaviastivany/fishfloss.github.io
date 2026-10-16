-- Jalankan di Supabase > SQL Editor > New query > Run

create table if not exists products (
  id serial primary key,
  name text not null,
  flavor text,
  description text,
  price int not null,
  stock int not null default 0,
  image text,
  active boolean default true
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  customer_name text not null,
  phone text not null,
  address text not null,
  note text,
  payment_method text not null check (payment_method in ('cod','transfer')),
  items jsonb not null,
  total int not null,
  status text not null default 'baru'
    check (status in ('baru','dibayar','diproses','diantar','selesai','batal')),
  delivery_date date
);

alter table products enable row level security;
alter table orders enable row level security;

-- Semua orang boleh melihat produk
create policy "produk dilihat semua" on products for select using (true);
-- Admin (user login) boleh kelola produk & pesanan
create policy "admin kelola produk" on products for all to authenticated using (true) with check (true);
create policy "admin lihat pesanan" on orders for select to authenticated using (true);
create policy "admin ubah pesanan" on orders for update to authenticated using (true) with check (true);

-- Pembeli membuat pesanan lewat fungsi ini (cek stok & hitung harga di server)
create or replace function place_order(
  p_name text, p_phone text, p_address text, p_note text,
  p_payment text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  it jsonb; prod products; v_total int := 0; v_items jsonb := '[]'::jsonb; v_id uuid;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    select * into prod from products where id = (it->>'id')::int and active for update;
    if not found then raise exception 'Produk tidak ditemukan'; end if;
    if (it->>'qty')::int < 1 or prod.stock < (it->>'qty')::int then
      raise exception 'Stok % tidak cukup', prod.name;
    end if;
    update products set stock = stock - (it->>'qty')::int where id = prod.id;
    v_total := v_total + prod.price * (it->>'qty')::int;
    v_items := v_items || jsonb_build_object('id', prod.id, 'name', prod.name,
               'price', prod.price, 'qty', (it->>'qty')::int);
  end loop;
  insert into orders(customer_name, phone, address, note, payment_method, items, total)
  values (p_name, p_phone, p_address, p_note, p_payment, v_items, v_total)
  returning id into v_id;
  return v_id;
end $$;

grant execute on function place_order to anon, authenticated;

-- Data awal 2 produk
insert into products (name, flavor, description, price, stock, image) values
('Abon Ikan Pedas Manis', 'Pedas Manis', 'Abon ikan laut berbumbu cabai dan gula merah. Gurih, manis, lalu pedas menyusul.', 35000, 50, 'images/pedas-manis.jpg'),
('Abon Ikan Daun Jeruk', 'Daun Jeruk', '100% ikan laut tanpa pengawet tambahan, dengan aroma segar daun jeruk.', 35000, 50, 'images/daun-jeruk.jpg');

-- LANGKAH ADMIN: Supabase > Authentication > Users > Add user
-- (isi email + password, centang Auto Confirm). Itu akun login admin.
