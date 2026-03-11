
-- Update all pizza items to use new size names (Klein 24cm, Normal 32cm, Gross 45cm)
UPDATE public.menu_items 
SET modifier_groups = jsonb_set(
  modifier_groups,
  '{0}',
  jsonb_build_object(
    'id', 'groesse',
    'name', 'Grösse',
    'required', true,
    'multiSelect', false,
    'options', jsonb_build_array(
      jsonb_build_object('id', 'klein', 'name', 'Klein 24cm', 'price', 0),
      jsonb_build_object('id', 'normal', 'name', 'Normal 32cm', 'price', (modifier_groups->0->'options'->1->>'price')::numeric),
      jsonb_build_object('id', 'gross', 'name', 'Gross 45cm', 'price', (modifier_groups->0->'options'->2->>'price')::numeric)
    )
  )
)
WHERE category IN ('pizza', 'kinder-pizza')
  AND modifier_groups->0->>'id' = 'groesse';
