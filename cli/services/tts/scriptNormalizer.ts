/**
 * Script Normalization
 * Ensures consistent format for audio scripts before TTS generation
 * 
 * IMPORTANT: This function is idempotent - calling it multiple times on the same
 * script will produce the same result. This allows safe re-normalization.
 */

/**
 * Normalize audio script format to ensure consistent parsing
 * - Removes generic speaker labels (Agent, Voix feminin, Personne A, etc.)
 * - Ensures proper line breaks between speakers
 * - Standardizes speaker name format
 * - Idempotent: safe to call multiple times
 */
export function normalizeScriptFormat(audioScript: string, sectionId?: number): string {
  if (!audioScript || !audioScript.trim()) {
    return audioScript;
  }

  // For Section 1, remove all speaker labels (should be monologue)
  if (sectionId === 1) {
    return removeAllSpeakerLabels(audioScript);
  }

  // For Sections 2, 3, 4, normalize dialogue format
  if (sectionId === 2 || sectionId === 3 || sectionId === 4) {
    return normalizeDialogueFormat(audioScript);
  }

  // If sectionId is unknown, try to detect and normalize
  return normalizeDialogueFormat(audioScript);
}

/**
 * Remove all speaker labels from script (for monologues)
 */
function removeAllSpeakerLabels(script: string): string {
  // Remove speaker labels at the start of lines
  let cleaned = script.replace(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?:\s*/gm, '');
  
  // Remove embedded speaker labels
  cleaned = cleaned.replace(/\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,25}?):\s*/g, (match, label) => {
    const trimmedLabel = label.trim();
    // Remove if it looks like a speaker label
    if (trimmedLabel.length >= 2 && 
        trimmedLabel.length <= 25 && 
        trimmedLabel[0] === trimmedLabel[0].toUpperCase()) {
      return ' ';
    }
    return match;
  });
  
  return cleaned.trim();
}

/**
 * Normalize dialogue format
 * - Replace generic labels with consistent names
 * - Ensure proper line breaks
 * - Clean up formatting
 */
function normalizeDialogueFormat(script: string): string {
  // Map of generic labels to standard names
  const labelMap: { [key: string]: string } = {
    'agent': 'Employé',
    'voix feminin': 'Client',
    'voix féminin': 'Client',
    'voix feminin:': 'Client',
    'voix féminin:': 'Client',
    'personne a': 'Employé',
    'personne b': 'Client',
    'personne a:': 'Employé',
    'personne b:': 'Client',
    'speaker 1': 'Employé',
    'speaker 2': 'Client',
    'speaker 1:': 'Employé',
    'speaker 2:': 'Client',
    'speaker1': 'Employé',
    'speaker2': 'Client',
    'speaker1:': 'Employé',
    'speaker2:': 'Client',
  };

  let normalized = script;

  // Replace generic labels (case-insensitive)
  for (const [generic, standard] of Object.entries(labelMap)) {
    const regex = new RegExp(`^${generic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`, 'gmi');
    normalized = normalized.replace(regex, `${standard}: `);
    
    // Also handle without colon at start of line
    const regexNoColon = new RegExp(`^${generic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'gmi');
    normalized = normalized.replace(regexNoColon, `${standard}:`);
  }

  // Ensure each speaker line is on its own line
  // Split by common patterns and rejoin with line breaks
  normalized = normalized.replace(/([.!?])\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*/g, '$1\n$2: ');
  
  // Normalize line breaks (multiple newlines to single)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  
  // Remove speaker labels that appear mid-sentence (not at start of line)
  // This handles cases like "textClient: more text"
  normalized = normalized.replace(/([^:\n])\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,25}?):\s*/g, (match, before, label) => {
    const trimmedLabel = label.trim().toLowerCase();
    // If it's a known generic label or looks like a speaker, move to new line
    if (labelMap[trimmedLabel] || (trimmedLabel.length >= 2 && trimmedLabel.length <= 25 && label[0] === label[0].toUpperCase())) {
      return `${before}\n${labelMap[trimmedLabel] || label.trim()}: `;
    }
    return match; // Keep it (might be part of text)
  });

  return normalized.trim();
}
