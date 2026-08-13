import type { Trainer } from '@/types/database'

export function getTrainerDisplayName(trainer: Pick<Trainer, 'name' | 'slug'>) {
  const name = trainer.name.trim()
  const slug = trainer.slug?.trim()
  if ((slug === 'fatima-tuz-zahra' || slug === 'dr-fatima-tuz-zahra') && !/^dr\.?\s/i.test(name)) {
    return `Dr. ${name}`
  }
  return name
}
