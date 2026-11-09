//villains for the intro fugitives slide, same as the table in PRODUCT_SPEC.md

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
