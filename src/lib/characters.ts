// Placeholder hero roster for character select (Phase 3). Just enough to
// make the picker functional — ids/colors only, no names/art tying this to
// a particular villain or mission. Swap freely once real hero identities
// and art exist (Phase 4).

export interface CharacterOption {
  id: string;
  label: string;
  color: string;
}

export const CHARACTERS: CharacterOption[] = [
  { id: 'hero-1', label: 'Hero 1', color: '#E6483C' },
  { id: 'hero-2', label: 'Hero 2', color: '#3DA5FF' },
  { id: 'hero-3', label: 'Hero 3', color: '#3DDC84' },
  { id: 'hero-4', label: 'Hero 4', color: '#FFC53D' },
];
