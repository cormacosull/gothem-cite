// Static villain roster for the intro's "Fugitives" slide — mirrors the
// Villain/Mission table in PRODUCT_SPEC.md. Distinct from characters.ts,
// which is the player's own hero pick, not an antagonist.

import type { MissionType } from './protocol';

export interface Villain {
  id: MissionType;
  name: string;
  crime: string;
}

export const VILLAINS: Villain[] = [
  { id: 'fire', name: 'The Jester', crime: 'setting fires across town' },
  { id: 'chase', name: 'The Pidgeon', crime: 'leading the police on a chase' },
  { id: 'bomb', name: 'The Puzzler', crime: 'rigging bombs to go off' },
];
