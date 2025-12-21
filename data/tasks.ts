
import { TEFTask } from '../types';

export const SECTION_A_TASKS: TEFTask[] = [
  { 
    "id": 1, 
    "section": "EO1", 
    "prompt": "Vous avez lu cette annonce pour un club de randonnée et vous êtes intéressé(e). Vous téléphonez pour avoir plus d’informations.", 
    "suggested_questions": ["Tarifs", "Difficulté", "Équipement", "Fréquence"], 
    "time_limit_sec": 240, 
    "image": "/section_a_images/section_a_image_1.png", 
    "difficulty": "medium" 
  },
  { 
    "id": 2, 
    "section": "EO1", 
    "prompt": "Annonce de cours de cuisine à domicile. Vous voulez en savoir plus sur les modalités.", 
    "suggested_questions": ["Prix", "Ingrédients fournis ?", "Nombre de participants", "Zone de déplacement"], 
    "time_limit_sec": 240, 
    "image": "/section_a_images/section_a_image_2.png", 
    "difficulty": "easy"
  }
];

export const SECTION_B_TASKS: TEFTask[] = [
  { 
    "id": 1, 
    "section": "EO2", 
    "prompt": "Une nouvelle application permet de partager ses outils de bricolage entre voisins. Convainquez un ami d'essayer.", 
    "counter_arguments": ["C’est risqué de prêter mes outils.", "Je préfère posséder mon propre matériel."], 
    "image": "/section_b_images/section_b_image_1.png", 
    "time_limit_sec": 480, 
    "difficulty": "medium" 
  },
  { 
    "id": 2, 
    "section": "EO2", 
    "prompt": "Le camping sauvage va être autorisé dans votre région. Convainquez un ami d'aller camper ce weekend.", 
    "counter_arguments": ["Il n'y a pas de confort.", "C'est dangereux."], 
    "image": "/section_b_images/section_b_image_2.png", 
    "time_limit_sec": 480, 
    "difficulty": "hard" 
  }
];
