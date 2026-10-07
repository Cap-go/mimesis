import { randomSelect } from './random'

const FIRST_NAMES = [
  'Léa',
  'Hugo',
  'Chloé',
  'Louis',
  'Emma',
  'Jules',
  'Manon',
  'Arthur',
  'Camille',
  'Nathan',
  'Inès',
  'Gabriel',
  'Zoé',
  'Raphaël',
  'Alice',
  'Lucas',
  'Jade',
  'Adam',
  'Lina',
  'Noah',
  'Sarah',
  'Paul',
  'Clara',
  'Tom',
  'Rose',
  'Léo',
  'Anna',
  'Victor',
  'Margaux',
  'Théo',
  'Juliette',
  'Sacha',
  'Lou',
  'Maël',
  'Eva',
  'Nina',
  'Oscar',
  'Romane',
  'Martin',
  'Agathe',
]

const TEAM_NAMES = [
  'Les Pingouins',
  'Les Licornes',
  'Les Mimosas',
  'Les Castors',
  'Les Ninjas',
  'Les Flamants',
  'Les Pirates',
  'Les Comètes',
  'Les Marmottes',
  'Les Renards',
  'Les Coquelicots',
  'Les Dragons',
  'Les Hiboux',
  'Les Tornades',
  'Les Pandas',
  'Les Lutins',
  'Les Cactus',
  'Les Requins',
]

export function randomFirstName(): string {
  return randomSelect(FIRST_NAMES)
}

export function randomTeamName(taken: string[] = []): string {
  const free = TEAM_NAMES.filter(name => !taken.includes(name))
  return randomSelect(free.length ? free : TEAM_NAMES)
}
