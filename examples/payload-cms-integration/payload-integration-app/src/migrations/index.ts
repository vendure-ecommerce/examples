import * as migration_20250902_053912_add_vendure_relationships from './20250902_053912_add_vendure_relationships';
import * as migration_20250902_054520_add_vendure_relationships from './20250902_054520_add_vendure_relationships';
import * as migration_20250902_054559_add_vendure_relationships from './20250902_054559_add_vendure_relationships';
import * as migration_20250902_055101_add_collections_to_variant from './20250902_055101_add_collections_to_variant';

export const migrations = [
  {
    up: migration_20250902_053912_add_vendure_relationships.up,
    down: migration_20250902_053912_add_vendure_relationships.down,
    name: '20250902_053912_add_vendure_relationships',
  },
  {
    up: migration_20250902_054520_add_vendure_relationships.up,
    down: migration_20250902_054520_add_vendure_relationships.down,
    name: '20250902_054520_add_vendure_relationships',
  },
  {
    up: migration_20250902_054559_add_vendure_relationships.up,
    down: migration_20250902_054559_add_vendure_relationships.down,
    name: '20250902_054559_add_vendure_relationships',
  },
  {
    up: migration_20250902_055101_add_collections_to_variant.up,
    down: migration_20250902_055101_add_collections_to_variant.down,
    name: '20250902_055101_add_collections_to_variant'
  },
];
