ALTER TABLE item_actions
  ADD COLUMN IF NOT EXISTS source_item_owner TEXT,
  ADD COLUMN IF NOT EXISTS target_item_owner TEXT;

CREATE INDEX IF NOT EXISTS item_actions_source_owner_idx
ON item_actions (source_item_owner, updated_at DESC);

CREATE INDEX IF NOT EXISTS item_actions_target_owner_idx
ON item_actions (target_item_owner, updated_at DESC);

ALTER TABLE action_events
  ADD COLUMN IF NOT EXISTS source_item_owner TEXT,
  ADD COLUMN IF NOT EXISTS target_item_owner TEXT;

CREATE INDEX IF NOT EXISTS action_events_source_owner_idx
ON action_events (source_item_owner, created_at DESC);

CREATE INDEX IF NOT EXISTS action_events_target_owner_idx
ON action_events (target_item_owner, created_at DESC);
