import type { CourseLesson } from '@/types/database'

export type JollySoundKey =
  | 's'
  | 'a'
  | 't'
  | 'i'
  | 'p'
  | 'n'
  | 'ck'
  | 'e'
  | 'h'
  | 'r'
  | 'm'
  | 'd'
  | 'g'
  | 'o'
  | 'u'
  | 'l'
  | 'f'
  | 'b'
  | 'ai'
  | 'j'
  | 'oa'
  | 'ie'
  | 'ee'
  | 'or'
  | 'z'
  | 'w'
  | 'ng'
  | 'v'
  | 'oo_long'
  | 'oo_short'
  | 'y'
  | 'x'
  | 'ch'
  | 'sh'
  | 'th_unvoiced'
  | 'th_voiced'
  | 'qu'
  | 'ou'
  | 'oi'
  | 'ue'
  | 'er'
  | 'ar'

export type JollyActivityData = NonNullable<CourseLesson['activity_data']>

type Theme = 'garden' | 'sky' | 'forest' | 'mountain' | 'ocean'

export type JollySoundCard = {
  key: JollySoundKey
  group: number
  order: number
  display: string
  label: string
  audioUrl: string
  audioSource: 'embedded-html' | 'jolly-42-pack'
  theme: Theme
  action: string
  formation: string
  examples: string[]
  nonExamples?: string[]
  blending: string[]
  segmenting: string[]
}

const clip = (file: string) => `/audio/jolly-phonics/42-sounds/${file}`
const group1Clip = (file: string) => `/audio/jolly-phonics/group-1/${file}`

export const JOLLY_PHONICS_SOUNDS: JollySoundCard[] = [
  {
    key: 's',
    group: 1,
    order: 1,
    display: 's',
    label: '/s/',
    audioUrl: group1Clip('01_s.mp3'),
    audioSource: 'embedded-html',
    theme: 'garden',
    action: 'Move your hand like a snake and say /s/.',
    formation: 'Start at the top, curve around, then curve back like a small snake.',
    examples: ['sun', 'sit', 'sat', 'sip'],
    blending: ['sat', 'sit', 'sip', 'pin'],
    segmenting: ['sat', 'sip', 'sit'],
  },
  {
    key: 'a',
    group: 1,
    order: 2,
    display: 'a',
    label: '/a/',
    audioUrl: group1Clip('02_a.mp3'),
    audioSource: 'embedded-html',
    theme: 'garden',
    action: 'Wiggle fingers above your arm as if ants are crawling and say /a/.',
    formation: 'Go around, up, down, and flick.',
    examples: ['ant', 'apple', 'sat', 'pan'],
    blending: ['at', 'sat', 'pat', 'tap'],
    segmenting: ['at', 'sat', 'pan'],
  },
  {
    key: 't',
    group: 1,
    order: 3,
    display: 't',
    label: '/t/',
    audioUrl: group1Clip('03_t.mp3'),
    audioSource: 'embedded-html',
    theme: 'garden',
    action: 'Turn your head side to side as if watching tennis and say /t/.',
    formation: 'Down the tower, then cross near the top.',
    examples: ['tap', 'top', 'ten', 'sat'],
    blending: ['tap', 'sat', 'tip', 'tin'],
    segmenting: ['tap', 'tin', 'sat'],
  },
  {
    key: 'i',
    group: 1,
    order: 4,
    display: 'i',
    label: '/i/',
    audioUrl: group1Clip('04_i.mp3'),
    audioSource: 'embedded-html',
    theme: 'garden',
    action: 'Wiggle your fingers near your nose like whiskers and say /i/.',
    formation: 'Down the insect body, lift, then dot.',
    examples: ['ink', 'in', 'sit', 'pin'],
    nonExamples: ['ice'],
    blending: ['in', 'sit', 'pin', 'tip'],
    segmenting: ['in', 'pin', 'sit'],
  },
  {
    key: 'p',
    group: 1,
    order: 5,
    display: 'p',
    label: '/p/',
    audioUrl: group1Clip('05_p.mp3'),
    audioSource: 'embedded-html',
    theme: 'garden',
    action: 'Hold up a finger like a candle and puff it out with /p/.',
    formation: 'Down the stem, up, around the puff.',
    examples: ['pin', 'pan', 'pat', 'tap'],
    blending: ['pin', 'pat', 'pit', 'tap'],
    segmenting: ['pin', 'pat', 'tap'],
  },
  {
    key: 'n',
    group: 1,
    order: 6,
    display: 'n',
    label: '/n/',
    audioUrl: group1Clip('06_n.mp3'),
    audioSource: 'embedded-html',
    theme: 'garden',
    action: 'Hold arms out like an aeroplane and hum /n/.',
    formation: 'Down, up, over, and down.',
    examples: ['net', 'nap', 'pin', 'tin'],
    blending: ['nap', 'pin', 'tin', 'ant'],
    segmenting: ['nap', 'pin', 'tin'],
  },
  {
    key: 'ck',
    group: 2,
    order: 7,
    display: 'c/k',
    label: '/k/',
    audioUrl: clip('07_ck.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Raise hands and click like a camera: /k/.',
    formation: 'Practise c as a curve and k as down, up, kick out, kick in.',
    examples: ['cat', 'kit', 'cap', 'kick'],
    blending: ['cat', 'kit', 'can', 'cot'],
    segmenting: ['cat', 'kit', 'cap'],
  },
  {
    key: 'e',
    group: 2,
    order: 8,
    display: 'e',
    label: '/e/',
    audioUrl: clip('08_e.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend to crack an egg and say /e/.',
    formation: 'Go across, around, and curl in.',
    examples: ['egg', 'end', 'hen', 'pen'],
    blending: ['ten', 'pen', 'net', 'hen'],
    segmenting: ['pen', 'hen', 'net'],
  },
  {
    key: 'h',
    group: 2,
    order: 9,
    display: 'h',
    label: '/h/',
    audioUrl: clip('09_h.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Hold a hand near your mouth and breathe out /h/.',
    formation: 'Down, back up, over the hill, and down.',
    examples: ['hat', 'hen', 'hop', 'hit'],
    blending: ['hat', 'hen', 'hit', 'hot'],
    segmenting: ['hat', 'hen', 'hit'],
  },
  {
    key: 'r',
    group: 2,
    order: 10,
    display: 'r',
    label: '/r/',
    audioUrl: clip('10_r.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend to be a puppy tugging a rag and say /r/.',
    formation: 'Down, up, and over a small shoulder.',
    examples: ['rat', 'run', 'rip', 'red'],
    blending: ['rat', 'ran', 'rip', 'red'],
    segmenting: ['rat', 'rip', 'red'],
  },
  {
    key: 'm',
    group: 2,
    order: 11,
    display: 'm',
    label: '/m/',
    audioUrl: clip('11_m.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Rub your tummy and say /m/.',
    formation: 'Down, up, over, down, up, over, down.',
    examples: ['mat', 'man', 'map', 'mom'],
    blending: ['mat', 'man', 'map', 'men'],
    segmenting: ['mat', 'map', 'men'],
  },
  {
    key: 'd',
    group: 2,
    order: 12,
    display: 'd',
    label: '/d/',
    audioUrl: clip('12_d.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Beat hands like a drum and say /d/.',
    formation: 'Around the drum, up, and down the stick.',
    examples: ['dog', 'dad', 'dip', 'red'],
    blending: ['dad', 'dip', 'den', 'mad'],
    segmenting: ['dad', 'dip', 'den'],
  },
  {
    key: 'g',
    group: 3,
    order: 13,
    display: 'g',
    label: '/g/',
    audioUrl: clip('13_g.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend water gurgles down the drain and say /g/.',
    formation: 'Around, up, down below the line, and curl.',
    examples: ['goat', 'gum', 'gap', 'pig'],
    blending: ['gap', 'gum', 'pig', 'tag'],
    segmenting: ['gap', 'pig', 'tag'],
  },
  {
    key: 'o',
    group: 3,
    order: 14,
    display: 'o',
    label: '/o/',
    audioUrl: clip('14_o.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend to turn a light switch on and off while saying /o/.',
    formation: 'Start at the top and go all the way around.',
    examples: ['on', 'top', 'pot', 'dog'],
    blending: ['on', 'pot', 'top', 'dog'],
    segmenting: ['on', 'pot', 'dog'],
  },
  {
    key: 'u',
    group: 3,
    order: 15,
    display: 'u',
    label: '/u/',
    audioUrl: clip('15_u.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend to open an umbrella and say /u/.',
    formation: 'Down, curve under, up, and down.',
    examples: ['up', 'sun', 'cup', 'mud'],
    blending: ['up', 'sun', 'cup', 'mud'],
    segmenting: ['up', 'cup', 'mud'],
  },
  {
    key: 'l',
    group: 3,
    order: 16,
    display: 'l',
    label: '/l/',
    audioUrl: clip('16_l.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend to lick a lollipop and say /l/.',
    formation: 'Start tall and go straight down.',
    examples: ['leg', 'lip', 'log', 'lap'],
    blending: ['leg', 'lip', 'log', 'lap'],
    segmenting: ['leg', 'lip', 'lap'],
  },
  {
    key: 'f',
    group: 3,
    order: 17,
    display: 'f',
    label: '/f/',
    audioUrl: clip('17_f.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Let air out of an imaginary balloon and say /f/.',
    formation: 'Curve down, go below the line, then cross.',
    examples: ['fan', 'fig', 'fog', 'off'],
    blending: ['fan', 'fig', 'fog', 'fin'],
    segmenting: ['fan', 'fig', 'fog'],
  },
  {
    key: 'b',
    group: 3,
    order: 18,
    display: 'b',
    label: '/b/',
    audioUrl: clip('18_b.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'garden',
    action: 'Pretend to hit a bat and ball and say /b/.',
    formation: 'Down the bat, up, around the ball.',
    examples: ['bat', 'bag', 'bed', 'bug'],
    blending: ['bat', 'bag', 'bed', 'bug'],
    segmenting: ['bat', 'bag', 'bug'],
  },
  {
    key: 'ai',
    group: 4,
    order: 19,
    display: 'ai',
    label: '/ai/',
    audioUrl: clip('19_ai.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'sky',
    action: 'Cup a hand to your ear as if you misheard and say /ai/.',
    formation: 'Write a and i close together; the two letters stay as one sound tile.',
    examples: ['rain', 'sail', 'tail', 'paint'],
    blending: ['rain', 'sail', 'tail', 'main'],
    segmenting: ['rain', 'sail', 'tail'],
  },
  {
    key: 'j',
    group: 4,
    order: 20,
    display: 'j',
    label: '/j/',
    audioUrl: clip('20_j.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'sky',
    action: 'Pretend to wobble like jelly and say /j/.',
    formation: 'Down, curl under, lift, and dot.',
    examples: ['jam', 'jug', 'jet', 'jog'],
    blending: ['jam', 'jet', 'jog', 'jug'],
    segmenting: ['jam', 'jet', 'jug'],
  },
  {
    key: 'oa',
    group: 4,
    order: 21,
    display: 'oa',
    label: '/oa/',
    audioUrl: clip('21_oa.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'sky',
    action: 'Open your mouth wide as if surprised and say /oa/.',
    formation: 'Write o and a close together; read them as one sound.',
    examples: ['boat', 'goat', 'coat', 'road'],
    blending: ['boat', 'goat', 'coat', 'road'],
    segmenting: ['boat', 'coat', 'road'],
  },
  {
    key: 'ie',
    group: 4,
    order: 22,
    display: 'ie',
    label: '/ie/',
    audioUrl: clip('22_ie.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'sky',
    action: 'Stand tall like a tie and say /ie/.',
    formation: 'Write i and e close together; keep the digraph joined.',
    examples: ['pie', 'tie', 'lie', 'cried'],
    blending: ['pie', 'tie', 'lie'],
    segmenting: ['pie', 'tie', 'lie'],
  },
  {
    key: 'ee',
    group: 4,
    order: 23,
    display: 'ee',
    label: '/ee/',
    audioUrl: clip('23_ee.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'sky',
    action: 'Put hands beside your head like donkey ears and say /ee/.',
    formation: 'Write e and e close together; both letters make one sound.',
    examples: ['bee', 'seed', 'feet', 'tree'],
    blending: ['bee', 'seed', 'feet', 'tree'],
    segmenting: ['bee', 'feet', 'tree'],
  },
  {
    key: 'or',
    group: 4,
    order: 24,
    display: 'or',
    label: '/or/',
    audioUrl: clip('24_or.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'sky',
    action: 'Pretend to open a door and say /or/.',
    formation: 'Write o and r close together; keep the sound tile whole.',
    examples: ['fork', 'corn', 'storm', 'horn'],
    blending: ['fork', 'corn', 'horn'],
    segmenting: ['fork', 'corn', 'horn'],
  },
  {
    key: 'z',
    group: 5,
    order: 25,
    display: 'z',
    label: '/z/',
    audioUrl: clip('25_z.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'forest',
    action: 'Pretend a bee is buzzing around and say /z/.',
    formation: 'Across, diagonal down, and across.',
    examples: ['zip', 'zigzag', 'buzz', 'zoo'],
    blending: ['zip', 'zap', 'buzz'],
    segmenting: ['zip', 'zap', 'buzz'],
  },
  {
    key: 'w',
    group: 5,
    order: 26,
    display: 'w',
    label: '/w/',
    audioUrl: clip('26_w.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'forest',
    action: 'Blow onto your open hand like the wind and say /w/.',
    formation: 'Down, up, down, up.',
    examples: ['web', 'wet', 'wig', 'win'],
    blending: ['web', 'wet', 'win', 'wig'],
    segmenting: ['web', 'wet', 'win'],
  },
  {
    key: 'ng',
    group: 5,
    order: 27,
    display: 'ng',
    label: '/ng/',
    audioUrl: clip('27_ng.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'forest',
    action: 'Pretend to lift something heavy and finish with /ng/.',
    formation: 'Write n and g together; do not split the digraph.',
    examples: ['ring', 'king', 'song', 'wing'],
    blending: ['ring', 'king', 'song', 'wing'],
    segmenting: ['ring', 'king', 'song'],
  },
  {
    key: 'v',
    group: 5,
    order: 28,
    display: 'v',
    label: '/v/',
    audioUrl: clip('28_v.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'forest',
    action: 'Pretend to drive a van and say /v/.',
    formation: 'Slant down, slant up.',
    examples: ['van', 'vet', 'vest', 'visit'],
    blending: ['van', 'vet', 'vest'],
    segmenting: ['van', 'vet', 'vest'],
  },
  {
    key: 'oo_long',
    group: 5,
    order: 29,
    display: 'oo',
    label: '/oo/ as in moon',
    audioUrl: clip('29_oo_long.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'forest',
    action: 'Look at the moon and stretch /oo/.',
    formation: 'Keep o and o together for the long oo sound.',
    examples: ['moon', 'food', 'spoon', 'boot'],
    blending: ['moon', 'food', 'boot'],
    segmenting: ['moon', 'food', 'boot'],
  },
  {
    key: 'oo_short',
    group: 5,
    order: 30,
    display: 'oo',
    label: '/oo/ as in book',
    audioUrl: clip('30_oo_short.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'forest',
    action: 'Open a pretend book and say the short /oo/.',
    formation: 'Keep o and o together for the book sound.',
    examples: ['book', 'look', 'cook', 'foot'],
    blending: ['book', 'look', 'cook'],
    segmenting: ['book', 'look', 'cook'],
  },
  {
    key: 'y',
    group: 6,
    order: 31,
    display: 'y',
    label: '/y/',
    audioUrl: clip('31_y.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'mountain',
    action: 'Pretend to eat yoghurt and say /y/.',
    formation: 'Down, up, down below the line.',
    examples: ['yarn', 'yak', 'yes', 'yogurt'],
    blending: ['yes', 'yak', 'yell'],
    segmenting: ['yes', 'yak', 'yell'],
  },
  {
    key: 'x',
    group: 6,
    order: 32,
    display: 'x',
    label: '/ks/',
    audioUrl: clip('32_x.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'mountain',
    action: 'Cross arms like an X and say /ks/.',
    formation: 'Slant one way, then cross the other way.',
    examples: ['box', 'fox', 'six', 'mix'],
    blending: ['box', 'fox', 'six', 'mix'],
    segmenting: ['box', 'fox', 'six'],
  },
  {
    key: 'ch',
    group: 6,
    order: 33,
    display: 'ch',
    label: '/ch/',
    audioUrl: clip('33_ch.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'mountain',
    action: 'Move arms like a train and say /ch/.',
    formation: 'Write c and h together; keep the digraph as one tile.',
    examples: ['chip', 'chat', 'chop', 'rich'],
    blending: ['chip', 'chat', 'chop', 'rich'],
    segmenting: ['chip', 'chat', 'rich'],
  },
  {
    key: 'sh',
    group: 6,
    order: 34,
    display: 'sh',
    label: '/sh/',
    audioUrl: clip('34_sh.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'mountain',
    action: 'Put a finger to your lips and say /sh/.',
    formation: 'Write s and h together; keep the sound quiet and whole.',
    examples: ['ship', 'shop', 'shell', 'fish'],
    blending: ['ship', 'shop', 'fish'],
    segmenting: ['ship', 'shop', 'fish'],
  },
  {
    key: 'th_unvoiced',
    group: 6,
    order: 35,
    display: 'th',
    label: '/th/ as in thin',
    audioUrl: clip('35_th_unvoiced.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'mountain',
    action: 'Put your tongue gently between teeth and whisper /th/.',
    formation: 'Write t and h together for the quiet th sound.',
    examples: ['thin', 'thumb', 'bath', 'moth'],
    blending: ['thin', 'bath', 'moth'],
    segmenting: ['thin', 'bath', 'moth'],
  },
  {
    key: 'th_voiced',
    group: 6,
    order: 36,
    display: 'th',
    label: '/th/ as in this',
    audioUrl: clip('36_th_voiced.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'mountain',
    action: 'Put your tongue gently between teeth and use your voice for /th/.',
    formation: 'Write t and h together for the voiced th sound.',
    examples: ['this', 'that', 'then', 'them'],
    blending: ['this', 'that', 'then'],
    segmenting: ['this', 'that', 'them'],
  },
  {
    key: 'qu',
    group: 7,
    order: 37,
    display: 'qu',
    label: '/qu/',
    audioUrl: clip('37_qu.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'ocean',
    action: 'Make a duck beak with your hand and say /qu/.',
    formation: 'Write q and u together; they travel as one sound tile.',
    examples: ['queen', 'quick', 'quiz', 'quack'],
    blending: ['quick', 'quiz', 'quack'],
    segmenting: ['quick', 'quiz', 'quack'],
  },
  {
    key: 'ou',
    group: 7,
    order: 38,
    display: 'ou',
    label: '/ou/',
    audioUrl: clip('38_ou.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'ocean',
    action: 'Pretend you hurt your finger and say /ou/.',
    formation: 'Write o and u close together; keep one sound.',
    examples: ['out', 'cloud', 'shout', 'round'],
    blending: ['out', 'cloud', 'shout'],
    segmenting: ['out', 'cloud', 'shout'],
  },
  {
    key: 'oi',
    group: 7,
    order: 39,
    display: 'oi',
    label: '/oi/',
    audioUrl: clip('39_oi.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'ocean',
    action: 'Cup hands around your mouth and call /oi/.',
    formation: 'Write o and i together as one sound tile.',
    examples: ['oil', 'coin', 'boil', 'soil'],
    blending: ['oil', 'coin', 'soil'],
    segmenting: ['oil', 'coin', 'soil'],
  },
  {
    key: 'ue',
    group: 7,
    order: 40,
    display: 'ue',
    label: '/ue/',
    audioUrl: clip('40_ue.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'ocean',
    action: 'Point to someone and say /ue/.',
    formation: 'Write u and e together; read them as one sound.',
    examples: ['cue', 'blue', 'glue', 'rescue'],
    blending: ['cue', 'blue', 'glue'],
    segmenting: ['cue', 'blue', 'glue'],
  },
  {
    key: 'er',
    group: 7,
    order: 41,
    display: 'er',
    label: '/er/',
    audioUrl: clip('41_er.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'ocean',
    action: 'Roll your hands like a mixer and say /er/.',
    formation: 'Write e and r together; keep the vowel sound connected.',
    examples: ['her', 'fern', 'term', 'letter'],
    blending: ['her', 'fern', 'term'],
    segmenting: ['her', 'fern', 'term'],
  },
  {
    key: 'ar',
    group: 7,
    order: 42,
    display: 'ar',
    label: '/ar/',
    audioUrl: clip('42_ar.mp3'),
    audioSource: 'jolly-42-pack',
    theme: 'ocean',
    action: 'Open your mouth at the doctor and say /ar/.',
    formation: 'Write a and r together; keep them as one sound.',
    examples: ['arm', 'star', 'farm', 'car'],
    blending: ['arm', 'star', 'farm'],
    segmenting: ['arm', 'star', 'farm'],
  },
]

const SOUND_BY_KEY = new Map(JOLLY_PHONICS_SOUNDS.map((sound) => [sound.key, sound]))

export function getJollySound(key: JollySoundKey) {
  return SOUND_BY_KEY.get(key)
}

export function getJollySounds(keys: JollySoundKey[]) {
  return keys.map((key) => {
    const sound = getJollySound(key)
    if (!sound) throw new Error(`Missing Jolly Phonics sound data for ${key}`)
    return sound
  })
}

export const GROUP_1_KEYS: JollySoundKey[] = ['s', 'a', 't', 'i', 'p', 'n']
export const GROUP_2_KEYS: JollySoundKey[] = ['ck', 'e', 'h', 'r', 'm', 'd']
export const GROUP_3_KEYS: JollySoundKey[] = ['g', 'o', 'u', 'l', 'f', 'b']
export const GROUP_4_KEYS: JollySoundKey[] = ['ai', 'j', 'oa', 'ie', 'ee', 'or']
export const GROUP_5_KEYS: JollySoundKey[] = ['z', 'w', 'ng', 'v', 'oo_long', 'oo_short']
export const GROUP_6_KEYS: JollySoundKey[] = ['y', 'x', 'ch', 'sh', 'th_unvoiced', 'th_voiced']
export const GROUP_7_KEYS: JollySoundKey[] = ['qu', 'ou', 'oi', 'ue', 'er', 'ar']

export const GROUPS_1_3_KEYS = [...GROUP_1_KEYS, ...GROUP_2_KEYS, ...GROUP_3_KEYS]
export const GROUPS_4_7_KEYS = [...GROUP_4_KEYS, ...GROUP_5_KEYS, ...GROUP_6_KEYS, ...GROUP_7_KEYS]

export function soundActivity(sound: JollySoundCard): JollyActivityData {
  return {
    jollyPhonicsInteractive: true,
    activityKind: 'sound_station',
    soundKey: sound.key,
    group: sound.group,
    displayGrapheme: sound.display,
    soundLabel: sound.label,
    audioUrl: sound.audioUrl,
    audioSource: sound.audioSource,
    flashcardTheme: sound.theme,
    action: sound.action,
    formation: sound.formation,
    examples: sound.examples,
    nonExamples: sound.nonExamples ?? [],
    blendingWords: sound.blending,
    segmentingWords: sound.segmenting,
    adminEditable: true,
  }
}

export function reviewActivity({
  title,
  group,
  keys,
  mode,
}: {
  title: string
  group: number | '1-3' | '4-7'
  keys: JollySoundKey[]
  mode: 'flashcards' | 'formation' | 'listening' | 'blending' | 'segmenting' | 'checkpoint' | 'review'
}): JollyActivityData {
  const sounds = getJollySounds(keys)
  const words = Array.from(new Set(sounds.flatMap((sound) =>
    mode === 'segmenting' ? sound.segmenting : sound.blending,
  ))).slice(0, 14)

  return {
    jollyPhonicsInteractive: true,
    activityKind: 'review_station',
    title,
    group,
    mode,
    flashcardTheme: sounds[0]?.theme ?? 'garden',
    sounds: sounds.map((sound) => ({
      key: sound.key,
      displayGrapheme: sound.display,
      soundLabel: sound.label,
      audioUrl: sound.audioUrl,
      examples: sound.examples,
    })),
    words,
    adminEditable: true,
  }
}

const REVIEW_BY_TITLE: Record<string, { keys: JollySoundKey[]; mode: 'flashcards' | 'formation' | 'listening' | 'blending' | 'segmenting' | 'checkpoint' | 'review' }> = {
  'Group 1 Flashcard Review': { keys: GROUP_1_KEYS, mode: 'flashcards' },
  'Group 1 Formation Practice': { keys: GROUP_1_KEYS, mode: 'formation' },
  'Group 1 Listening Game': { keys: GROUP_1_KEYS, mode: 'listening' },
  'Group 1 Blending Practice': { keys: GROUP_1_KEYS, mode: 'blending' },
  'Group 1 Segmenting Practice': { keys: GROUP_1_KEYS, mode: 'segmenting' },
  'Group 1 Checkpoint': { keys: GROUP_1_KEYS, mode: 'checkpoint' },
  'Group 1 Practice and Review': { keys: GROUP_1_KEYS, mode: 'review' },
  'Group 2 Flashcard Review': { keys: GROUP_2_KEYS, mode: 'flashcards' },
  'Group 2 Formation Practice': { keys: GROUP_2_KEYS, mode: 'formation' },
  'Group 2 Listening Game': { keys: GROUP_2_KEYS, mode: 'listening' },
  'Groups 1-2 Blending': { keys: [...GROUP_1_KEYS, ...GROUP_2_KEYS], mode: 'blending' },
  'Groups 1-2 Segmenting': { keys: [...GROUP_1_KEYS, ...GROUP_2_KEYS], mode: 'segmenting' },
  'Group 2 Checkpoint': { keys: GROUP_2_KEYS, mode: 'checkpoint' },
  'Group 2 Practice and Review': { keys: GROUP_2_KEYS, mode: 'review' },
  'Group 3 Flashcard Review': { keys: GROUP_3_KEYS, mode: 'flashcards' },
  'Group 3 Formation Practice': { keys: GROUP_3_KEYS, mode: 'formation' },
  'Group 3 Listening Game': { keys: GROUP_3_KEYS, mode: 'listening' },
  'Groups 1-3 Blending': { keys: GROUPS_1_3_KEYS, mode: 'blending' },
  'Groups 1-3 Segmenting': { keys: GROUPS_1_3_KEYS, mode: 'segmenting' },
  'Group 3 Checkpoint': { keys: GROUP_3_KEYS, mode: 'checkpoint' },
  'Group 3 Practice and Review': { keys: GROUP_3_KEYS, mode: 'review' },
  'Groups 1-3 Blending Activities': { keys: GROUPS_1_3_KEYS, mode: 'blending' },
  'Groups 1-3 Segmenting Activities': { keys: GROUPS_1_3_KEYS, mode: 'segmenting' },
  'Groups 1-3 Review': { keys: GROUPS_1_3_KEYS, mode: 'review' },
  'Group 4 Practice and Review': { keys: GROUP_4_KEYS, mode: 'review' },
  'Group 5 Practice and Review': { keys: GROUP_5_KEYS, mode: 'review' },
  'Group 6 Practice and Review': { keys: GROUP_6_KEYS, mode: 'review' },
  'Group 7 Practice and Review': { keys: GROUP_7_KEYS, mode: 'review' },
  'Groups 4-7 Blending Activities': { keys: GROUPS_4_7_KEYS, mode: 'blending' },
  'Groups 4-7 Segmenting Activities': { keys: GROUPS_4_7_KEYS, mode: 'segmenting' },
  'Groups 4-7 Review': { keys: GROUPS_4_7_KEYS, mode: 'review' },
}

const SOUND_KEY_BY_TITLE: Record<string, JollySoundKey> = {
  'Sound s': 's',
  'Sound a': 'a',
  'Sound t': 't',
  'Sound i': 'i',
  'Sound p': 'p',
  'Sound n': 'n',
  'Sound c': 'ck',
  'Sound c/k': 'ck',
  'Sound k': 'ck',
  'Sound e': 'e',
  'Sound h': 'h',
  'Sound r': 'r',
  'Sound m': 'm',
  'Sound d': 'd',
  'Sound g': 'g',
  'Sound o': 'o',
  'Sound u': 'u',
  'Sound l': 'l',
  'Sound f': 'f',
  'Sound b': 'b',
  'Sound ai': 'ai',
  'Sound j': 'j',
  'Sound oa': 'oa',
  'Sound ie': 'ie',
  'Sound ee': 'ee',
  'Sound or': 'or',
  'Sound z': 'z',
  'Sound w': 'w',
  'Sound ng': 'ng',
  'Sound v': 'v',
  'Sound oo (long)': 'oo_long',
  'Sound oo (moon)': 'oo_long',
  'Sound oo (short)': 'oo_short',
  'Sound oo (book)': 'oo_short',
  'Sound y': 'y',
  'Sound x': 'x',
  'Sound ch': 'ch',
  'Sound sh': 'sh',
  'Sound th (unvoiced)': 'th_unvoiced',
  'Sound th (voiced)': 'th_voiced',
  'Sound qu': 'qu',
  'Sound ou': 'ou',
  'Sound oi': 'oi',
  'Sound ue': 'ue',
  'Sound er': 'er',
  'Sound ar': 'ar',
}

export function jollyActivityForLesson(title: string, activityData?: Record<string, unknown> | null): JollyActivityData | null {
  if (activityData?.jollyPhonicsInteractive === true) return activityData

  const soundKey = SOUND_KEY_BY_TITLE[title]
  if (soundKey) {
    const sound = getJollySound(soundKey)
    return sound ? soundActivity(sound) : null
  }

  const review = REVIEW_BY_TITLE[title]
  return review
    ? reviewActivity({
        title,
        group: review.keys.length === GROUPS_1_3_KEYS.length ? '1-3' : review.keys.length === GROUPS_4_7_KEYS.length ? '4-7' : getJollySound(review.keys[0])?.group ?? 1,
        keys: review.keys,
        mode: review.mode,
      })
    : null
}

const GROUPS_1_3_TITLES = [
  [
    'Sound s',
    'Sound a',
    'Sound t',
    'Sound i',
    'Sound p',
    'Sound n',
    'Group 1 Flashcard Review',
    'Group 1 Formation Practice',
    'Group 1 Listening Game',
    'Group 1 Blending Practice',
    'Group 1 Segmenting Practice',
    'Group 1 Checkpoint',
    'Group 1 Practice and Review',
  ],
  [
    'Sound c/k',
    'Sound e',
    'Sound h',
    'Sound r',
    'Sound m',
    'Sound d',
    'Group 2 Flashcard Review',
    'Group 2 Formation Practice',
    'Group 2 Listening Game',
    'Groups 1-2 Blending',
    'Groups 1-2 Segmenting',
    'Group 2 Checkpoint',
    'Group 2 Practice and Review',
  ],
  [
    'Sound g',
    'Sound o',
    'Sound u',
    'Sound l',
    'Sound f',
    'Sound b',
    'Group 3 Flashcard Review',
    'Group 3 Formation Practice',
    'Group 3 Listening Game',
    'Groups 1-3 Blending',
    'Groups 1-3 Segmenting',
    'Group 3 Checkpoint',
    'Group 3 Practice and Review',
  ],
  [
    'Groups 1-3 Blending Activities',
    'Groups 1-3 Segmenting Activities',
    'Groups 1-3 Review',
  ],
]

const GROUPS_4_7_TITLES = [
  ['Sound ai', 'Sound j', 'Sound oa', 'Sound ie', 'Sound ee', 'Sound or', 'Group 4 Practice and Review'],
  ['Sound z', 'Sound w', 'Sound ng', 'Sound v', 'Sound oo (moon)', 'Sound oo (book)', 'Group 5 Practice and Review'],
  ['Sound y', 'Sound x', 'Sound ch', 'Sound sh', 'Sound th (unvoiced)', 'Sound th (voiced)', 'Group 6 Practice and Review'],
  ['Sound qu', 'Sound ou', 'Sound oi', 'Sound ue', 'Sound er', 'Sound ar', 'Group 7 Practice and Review'],
  ['Groups 4-7 Blending Activities', 'Groups 4-7 Segmenting Activities', 'Groups 4-7 Review'],
]

export type JollyLessonTemplate = {
  title: string
  duration?: string
  description?: string
  thumbnail_url?: string
  video_url?: string
  material_url?: string
  activity_data: JollyActivityData
}

function lessonTemplate(title: string): JollyLessonTemplate {
  const activity = jollyActivityForLesson(title, null) ?? {}
  const isReview = activity.activityKind === 'review_station'
  return {
    title,
    duration: isReview ? '10 min' : '8 min',
    description: isReview
      ? `${title} with audio flashcards, word tiles, blending, segmenting, and child-friendly review.`
      : `${title} interactive station with audio, action, flashcard, tracing, examples, blending, and segmenting.`,
    activity_data: activity,
  }
}

export function jollyLessonTemplatesForCourse(slug: string): JollyLessonTemplate[][] {
  if (slug === 'jolly-phonics-sounds-groups-1-3') return GROUPS_1_3_TITLES.map((titles) => titles.map(lessonTemplate))
  if (slug === 'jolly-phonics-sounds-groups-4-7') return GROUPS_4_7_TITLES.map((titles) => titles.map(lessonTemplate))
  return []
}
