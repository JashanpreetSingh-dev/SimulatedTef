/**
 * French accent characters available in the exam interface
 */
export interface FrenchAccent {
  char: string;
  label: string;
  uppercase: string; // Uppercase version of the accent
}

export const FRENCH_ACCENTS: FrenchAccent[] = [
  { char: 'à', label: 'à', uppercase: 'À' },
  { char: 'â', label: 'â', uppercase: 'Â' },
  { char: 'ä', label: 'ä', uppercase: 'Ä' },
  { char: 'é', label: 'é', uppercase: 'É' },
  { char: 'è', label: 'è', uppercase: 'È' },
  { char: 'ê', label: 'ê', uppercase: 'Ê' },
  { char: 'ë', label: 'ë', uppercase: 'Ë' },
  { char: 'î', label: 'î', uppercase: 'Î' },
  { char: 'ï', label: 'ï', uppercase: 'Ï' },
  { char: 'ô', label: 'ô', uppercase: 'Ô' },
  { char: 'ö', label: 'ö', uppercase: 'Ö' },
  { char: 'ù', label: 'ù', uppercase: 'Ù' },
  { char: 'û', label: 'û', uppercase: 'Û' },
  { char: 'ü', label: 'ü', uppercase: 'Ü' },
  { char: 'ç', label: 'ç', uppercase: 'Ç' },
  { char: 'œ', label: 'œ', uppercase: 'Œ' },
  { char: 'æ', label: 'æ', uppercase: 'Æ' },
];
