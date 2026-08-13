import type { Trainer } from '@/types/database'
import { slugify } from '@/utils/slug'

const TRAINER_IMAGE_BY_SLUG: Record<string, string> = {
  'ambreen-owais': '/images/trainers/ambreen.png',
  'anum-zehra-zaidi': '/images/trainers/Anum-Zahra-1.png',
  'anum-zahra-zaidi': '/images/trainers/Anum-Zahra-1.png',
  'fatima-tuz-zahra': '/images/trainers/dr%20fatima%20tuz%20zahra.jpg',
  'dr-fatima-tuz-zahra': '/images/trainers/dr%20fatima%20tuz%20zahra.jpg',
  'erum-tehreem': '/images/trainers/erum%20tehreem.png',
  'sadaf-asif': '/images/trainers/sadaf%20asif.png',
  'tahira-sheikh': '/images/trainers/tahira.png',
  'tamkanat-zafar': '/images/trainers/tamkanat.png',
  'zaibunnissa-sadozai': '/images/trainers/zaibunnisa%20sadozai.png',
  'zaibunnisa-sadozai': '/images/trainers/zaibunnisa%20sadozai.png',
}

export function getTrainerImageUrl(trainer: Pick<Trainer, 'name' | 'slug' | 'image_url'>) {
  if (trainer.image_url) return trainer.image_url
  const trainerSlug = trainer.slug || slugify(trainer.name)
  return TRAINER_IMAGE_BY_SLUG[trainerSlug] ?? null
}
