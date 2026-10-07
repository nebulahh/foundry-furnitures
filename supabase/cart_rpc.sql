-- Apply once in the Supabase SQL Editor for the shared FurniLux project.
-- Cart edits are atomic operations on the current row, not snapshot replacement.
create or replace function public.mutate_cart(
  p_action text,
  p_product_id text default null,
  p_item jsonb default null,
  p_quantity integer default null,
  p_items jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_items jsonb;
  v_old_items jsonb;
  v_item jsonb;
  v_found boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_action = 'initialize' then
    if p_items is not null and jsonb_typeof(p_items) <> 'array' then
      raise exception 'Initial cart must be an array';
    end if;
    insert into public.carts (user_id, items)
    values (v_user_id, coalesce(p_items, '[]'::jsonb))
    on conflict (user_id) do nothing;
  end if;

  select items into v_old_items
  from public.carts
  where user_id = v_user_id
  for update;

  if not found then
    insert into public.carts (user_id, items)
    values (v_user_id, '[]'::jsonb)
    on conflict (user_id) do nothing;
    select items into v_old_items
    from public.carts
    where user_id = v_user_id
    for update;
  end if;

  v_old_items := coalesce(v_old_items, '[]'::jsonb);
  if p_action = 'initialize' then
    return v_old_items;
  elsif p_action = 'clear' then
    v_items := '[]'::jsonb;
  elsif p_action in ('add', 'set_quantity', 'remove') then
    if p_product_id is null then
      raise exception 'Product ID is required';
    end if;
    if p_action = 'add' and (
      p_item is null
      or jsonb_typeof(p_item) <> 'object'
      or p_item->>'productId' <> p_product_id
      or coalesce(p_quantity, 0) < 1
    ) then
      raise exception 'A valid cart item and positive quantity are required';
    end if;
    if p_action = 'set_quantity' and p_quantity is null then
      raise exception 'Quantity is required';
    end if;

    v_items := '[]'::jsonb;
    for v_item in
      select value from jsonb_array_elements(v_old_items) as entries(value)
    loop
      if v_item->>'productId' = p_product_id then
        v_found := true;
        if p_action = 'add' then
          v_item := jsonb_set(
            v_item,
            '{quantity}',
            to_jsonb(coalesce((v_item->>'quantity')::integer, 0) + p_quantity),
            true
          );
          v_items := v_items || jsonb_build_array(v_item);
        elsif p_action = 'set_quantity' and p_quantity > 0 then
          v_item := jsonb_set(v_item, '{quantity}', to_jsonb(p_quantity), true);
          v_items := v_items || jsonb_build_array(v_item);
        elsif p_action = 'remove' or p_quantity <= 0 then
          null; -- Omit the matching row.
        else
          v_items := v_items || jsonb_build_array(v_item);
        end if;
      else
        v_items := v_items || jsonb_build_array(v_item);
      end if;
    end loop;

    if p_action = 'add' and not v_found then
      v_items := v_items || jsonb_build_array(
        jsonb_set(p_item, '{quantity}', to_jsonb(p_quantity), true)
      );
    end if;
  else
    raise exception 'Unsupported cart action: %', p_action;
  end if;

  update public.carts
  set items = coalesce(v_items, '[]'::jsonb), updated_at = now()
  where user_id = v_user_id
  returning items into v_items;

  return coalesce(v_items, '[]'::jsonb);
end;
$$;

revoke all on function public.mutate_cart(text, text, jsonb, integer, jsonb) from public;
grant execute on function public.mutate_cart(text, text, jsonb, integer, jsonb) to authenticated;
