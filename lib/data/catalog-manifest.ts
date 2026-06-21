/** Raw catalog: [imagePath from /images/, displayName, price PKR, category, optional ISBN suffix] */
export type ManifestRow = [string, string, number, string, string?, boolean?]

export const CATALOG_MANIFEST: ManifestRow[] = [
  // Activity Books
  ['Activity Books/Jolly-Phonics-Activity-Book-1.jpg', 'Jolly Phonics Activity Book 1 (New)', 3150, 'activity-books', 'AB001'],
  ['Activity Books/Jolly-Phonics-Activity-Book-2.jpg', 'Jolly Phonics Activity Book 2 (New)', 3150, 'activity-books', 'AB002'],
  ['Activity Books/Jolly-Phonics-Activity-Book-3.jpg', 'Jolly Phonics Activity Book 3 (New)', 3150, 'activity-books', 'AB003'],
  ['Activity Books/Jolly-Phonics-Activity-Book-4.jpg', 'Jolly Phonics Activity Book 4 (New)', 3150, 'activity-books', 'AB004'],
  ['Activity Books/Jolly-Phonics-Activity-Book-5.jpg', 'Jolly Phonics Activity Book 5 (New)', 3150, 'activity-books', 'AB005'],
  ['Activity Books/Jolly-Phonics-Activity-Book-6.jpg', 'Jolly Phonics Activity Book 6 (New)', 3150, 'activity-books', 'AB006'],
  ['Activity Books/Jolly-Phonics-Activity-Book-7.jpg', 'Jolly Phonics Activity Book 7 (New)', 3150, 'activity-books', 'AB007'],
  ['Activity Books/Jolly-Phonics-Activity-Book-Complete-Set.jpg', 'Jolly Phonics Activity Books 1-7 Complete Set (New)', 22050, 'activity-books', 'ABSET', true],

  // Pupil Books
  ['Pupilbooks/Phonics-Pupil-Book-1-color.jpg', 'JP Pupil Book 1 (Colour)', 700, 'pupil-books', 'PB101', true],
  ['Pupilbooks/Phonics-Pupil-Book-2-color.jpg', 'JP Pupil Book 2 (Colour)', 700, 'pupil-books', 'PB102'],
  ['Pupilbooks/Phonics-Pupil-Book-3-color.jpg', 'JP Pupil Book 3 (Colour)', 700, 'pupil-books', 'PB103'],
  ['Pupilbooks/Phonics-Pupil-Book-1-BW.jpg', 'JP Pupil Book 1 (Black & White)', 600, 'pupil-books', 'PB201'],
  ['Pupilbooks/Phonics-Pupil-Book-2-BW.jpg', 'JP Pupil Book 2 (Black & White)', 600, 'pupil-books', 'PB202'],

  // Workbooks - Jolly Phonics
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-1.jpg', 'JP Workbook 1', 600, 'workbooks', 'WB001'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-2.jpg', 'JP Workbook 2', 600, 'workbooks', 'WB002'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-3.jpg', 'JP Workbook 3', 600, 'workbooks', 'WB003'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-4.jpg', 'JP Workbook 4', 600, 'workbooks', 'WB004'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-5.jpg', 'JP Workbook 5', 600, 'workbooks', 'WB005'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-6.jpg', 'JP Workbook 6', 600, 'workbooks', 'WB006'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-7.jpg', 'JP Workbook 7', 600, 'workbooks', 'WB007'],
  ['workbooks/Jolly Phonics/Jolly-Phonics-Workbooks-Set-1-7.jpg', 'JP Workbooks Set 1-7', 3500, 'workbooks', 'WBSET', true],
  ['workbooks/grammar/Jolly-Grammar-1-Workbooks-Set-1-6.jpg', 'Grammar 1 Workbooks Set 1-6', 3000, 'grammar-workbooks', 'GWSET'],

  // Grammar Pupil Books 1-6
  ['SLG pupil books/SGP-pupil-book-1.jpg', 'Jolly Literacy Spelling, Grammar & Punctuation Pupil Book 1', 1300, 'grammar-pupil-books', 'GP001'],
  ['SLG pupil books/SGP-pupil-book-2.jpg', 'Jolly Literacy Spelling, Grammar & Punctuation Pupil Book 2', 1300, 'grammar-pupil-books', 'GP002'],
  ['SLG pupil books/SGP-pupil-book-3.jpg', 'Jolly Literacy Spelling, Grammar & Punctuation Pupil Book 3', 1300, 'grammar-pupil-books', 'GP003'],
  ['SLG pupil books/SGP-pupil-book-4.jpg', 'Jolly Literacy Spelling, Grammar & Punctuation Pupil Book 4', 1300, 'grammar-pupil-books', 'GP004'],
  ['SLG pupil books/SGP-pupil-book-5.jpg', 'Jolly Literacy Spelling, Grammar & Punctuation Pupil Book 5', 1300, 'grammar-pupil-books', 'GP005'],
  ['SLG pupil books/SGP-pupil-book-6.jpg', 'Jolly Literacy Spelling, Grammar & Punctuation Pupil Book 6', 1300, 'grammar-pupil-books', 'GP006'],

  // Teachers Books
  ['TEACHERS BOOK/Phonics-Teacher-Book-color.jpg', "Jolly Phonics Teacher's Book (Coloured)", 1800, 'teachers-books', 'TB100', true],
  ['TEACHERS BOOK/Phonics-Teacher-Book-BW.jpg', "Jolly Phonics Teacher's Book (Black & White)", 1000, 'teachers-books', 'TB101'],
  ['TEACHERS BOOK/SGP-teachersbook-1.jpg', "Jolly Literacy Teacher's Book 1 (Spelling, Grammar & Punctuation)", 1700, 'teachers-books', 'TB201'],
  ['TEACHERS BOOK/SGP-teachersbook-2.jpg', "Jolly Literacy Teacher's Book 2 (Spelling, Grammar & Punctuation)", 1700, 'teachers-books', 'TB202'],
  ['TEACHERS BOOK/SGP-teachersbook-3.jpg', "Jolly Literacy Teacher's Book 3 (Spelling, Grammar & Punctuation)", 1700, 'teachers-books', 'TB203'],
  ['TEACHERS BOOK/SGP-teachersbook-4.jpg', "Jolly Literacy Teacher's Book 4 (Spelling, Grammar & Punctuation)", 1700, 'teachers-books', 'TB204'],
  ['TEACHERS BOOK/SGP-teachersbook-5.jpg', "Jolly Literacy Teacher's Book 5 (Spelling, Grammar & Punctuation)", 1700, 'teachers-books', 'TB205'],
  ['TEACHERS BOOK/SGP-teachersbook-6.jpg', "Jolly Literacy Teacher's Book 6 (Spelling, Grammar & Punctuation)", 1700, 'teachers-books', 'TB206'],
  ['TEACHERS BOOK/COMPREHENSION/RC&WS_1_TB_BEpc_FrontCover_FINAL_page-0001.jpg', "Jolly Literacy Comprehension & Creative Writing Teacher's Book 1", 2995, 'teachers-books', 'TB301'],

  // Comprehension
  ['COMPREHENSION/RC_1_BEpc_Frontcover_FINAL_page-0001.jpg', 'Jolly Literacy Comprehension Pupil Book 1', 1295, 'comprehension', 'CP001'],
  ['COMPREHENSION/workbook.jpg', 'Jolly Literacy Creative Writing Workbook 1', 1695, 'comprehension', 'CW001'],

  // Kits
  ['KITS/JL787 starter kit.jpg', 'Starter Kit Revised (No DVD)', 150000, 'kits', 'KIT001', true],
  ['KITS/Jolly-Phonics-Classroom-Kit.jpg', 'Jolly Phonics Classroom Kit', 0, 'kits', 'KIT002'],
  ['KITS/Phonics-Class-Set.jpg', 'Phonics Class Set', 0, 'kits', 'KIT003'],
  ['KITS/Jolly-English-Teachers-Kit.jpg', 'Jolly English Teachers Kit (with Puppets)', 0, 'kits', 'KIT004'],
  ['KITS/Jolly-English-Teachers-Kit-without-puppets.jpg', 'Jolly English Teachers Kit (without Puppets)', 0, 'kits', 'KIT005'],

  // Resources
  ['resources/Jolly-Dictionary.jpg', 'Jolly Dictionary', 5500, 'teacher-resources', 'TR001', true],
  ['resources/Letter-Sound-Strips.jpg', 'Letter Sound Strips (Pack of 30)', 5500, 'teacher-resources', 'TR002'],
  ['resources/Jolly-Phonics-Cards.jpg', 'Jolly Phonics Cards (Set of 4 Boxes)', 21000, 'teacher-resources', 'TR003'],
  ['resources/Jolly-Phonics-Picture-Flashcards.jpg', 'Picture Flash Cards', 6500, 'teacher-resources', 'TR004'],
  ['resources/Jolly-Phonics-Wall-Frieze.jpg', 'Wall Frieze (Pack of 7 Strips)', 5500, 'teacher-resources', 'TR005'],
  ['resources/Jolly-Phonics-Letter-Sound-Poster.jpg', 'Letter Sound Poster, Wall Chart & Tricky Words Poster', 2800, 'teacher-resources', 'TR006'],
  ['resources/Jolly-Phonics-Alternative-Spelling-&-Alphabet -Posters.jpg', 'JP Alternative Spelling & Alphabet Posters', 5500, 'teacher-resources', 'TR007'],
  ['resources/Jolly-Phonics-Handbook.jpg', 'The Phonics Handbook', 7500, 'teacher-resources', 'TR008', true],
  ['resources/Jolly-Phonics-Word-Book.jpg', 'Word Book', 1750, 'teacher-resources', 'TR009'],
  ['resources/Jolly-Stories.jpg', 'Jolly Stories', 15000, 'teacher-resources', 'TR010'],
  ['resources/Letter Sounds Wall Chart.jpg', 'Letter Sounds Wall Chart', 2800, 'teacher-resources', 'TR011'],
  ['resources/Blends-Wheels.jpg', 'Blends Wheels (Pack of 10)', 7500, 'teacher-resources', 'TR012'],
  ['resources/Jolly-Plays.jpg', 'Jolly Plays', 12000, 'teacher-resources', 'TR013'],
  ['resources/Jolly-Phonics-Reading-Assessment.jpg', 'Reading Assessment', 33000, 'teacher-resources', 'TR014'],
  ['resources/Jolly-Songs.jpg', 'Grammar Songs (Book and CD)', 2700, 'teacher-resources', 'TR015'],
  ['resources/Little-Word-Books.jpg', 'Little Word Books Complete Set (14 Books)', 5000, 'teacher-resources', 'TR016'],
  ['resources/Read and See Pack 1_new.png', 'Read and See Pack 1 (12 Titles)', 4042, 'teacher-resources', 'TR017'],
  ['resources/Read and See Pack 2_new.png', 'Read and See Pack 2 (12 Titles)', 4043, 'teacher-resources', 'TR018'],
  ['resources/Word-Bank-Book.jpg', 'Word Bank Book', 1750, 'teacher-resources', 'TR019'],
  ['resources/My-First-Letter-Sounds.jpg', 'My First Letter Sounds', 0, 'teacher-resources', 'TR020'],
  ['resources/Finger-Phonics-1.jpg', 'Finger Phonics Book 1', 3200, 'teacher-resources', 'FP001'],
  ['resources/Finger-Phonics-2.jpg', 'Finger Phonics Book 2', 3200, 'teacher-resources', 'FP002'],
  ['resources/Finger-Phonics-3.jpg', 'Finger Phonics Book 3', 3200, 'teacher-resources', 'FP003'],
  ['resources/Finger-Phonics-4.jpg', 'Finger Phonics Book 4', 3200, 'teacher-resources', 'FP004'],
  ['resources/Finger-Phonics-5.jpg', 'Finger Phonics Book 5', 3200, 'teacher-resources', 'FP005'],
  ['resources/Finger-Phonics-6.jpg', 'Finger Phonics Book 6', 3200, 'teacher-resources', 'FP006'],
  ['resources/Finger-Phonics-7.jpg', 'Finger Phonics Book 7', 3200, 'teacher-resources', 'FP007'],
  ['resources/Finger-Phonics-Set-1-7.jpg', 'Finger Phonics Books 1-7 Set (Hardback)', 23800, 'teacher-resources', 'FPSET', true],
  ['resources/Handwriting-books.jpeg', 'Handwriting Books', 0, 'teacher-resources', 'TR021'],
  ['resources/Jolly-English-Level-1-Pupil-Set.jpg', 'Jolly English Level 1 Pupil Set', 0, 'teacher-resources', 'TR022'],
  ['resources/Jolly-English-Level-2-Pupil-Set.jpg', 'Jolly English Level 2 Pupil Set', 0, 'teacher-resources', 'TR023'],

  // Orange Readers 1-7
  ['Readers/orange/Orange-Readers-Set-1.jpg', 'Orange Level Readers Set 1 (Pack of 3)', 1050, 'readers', 'OR001'],
  ['Readers/orange/Orange-Readers-Set-2.jpg', 'Orange Level Readers Set 2 (Pack of 3)', 1050, 'readers', 'OR002'],
  ['Readers/orange/Orange-Readers-Set-3.jpg', 'Orange Level Readers Set 3 (Pack of 3)', 1050, 'readers', 'OR003'],
  ['Readers/orange/Orange-Readers-Set-4.jpg', 'Orange Level Readers Set 4 (Pack of 3)', 1050, 'readers', 'OR004'],
  ['Readers/orange/Orange-Readers-Set-5.jpg', 'Orange Level Readers Set 5 (Pack of 3)', 1050, 'readers', 'OR005'],
  ['Readers/orange/Orange-Readers-Set-6.jpg', 'Orange Level Readers Set 6 (Pack of 3)', 1050, 'readers', 'OR006'],
  ['Readers/orange/Orange-Readers-Set-7.jpg', 'Orange Level Readers Set 7 (Pack of 3)', 1050, 'readers', 'OR007'],
  ['Readers/orange/Orange-Readers-Complete-Set.jpg', 'Orange Level Complete Set (Pack of 21)', 7350, 'readers', 'ORSET', true],

  // Red Level 1
  ['Readers/Red/L1-Red-Reader-Set-1-Inky-Mouse-and-Friends.jpg', 'Level 1 Inky and Friends (Pack of 6)', 1800, 'readers', 'RD101'],
  ['Readers/Red/L1-Red-Reader-Set-2-General-Fiction.jpg', 'Level 1 General Fiction (Pack of 6)', 1800, 'readers', 'RD102'],
  ['Readers/Red/L1-Red-Reader-Set-3-Nonfiction.jpg', 'Level 1 Non-Fiction (Pack of 6)', 1800, 'readers', 'RD103'],
  ['Readers/Red/L1-Red-Reader-Complete-Set.jpg', 'Level 1 Red Readers Complete Set (Pack of 18)', 0, 'readers', 'RDSET'],
  ['Readers/FolkTales/Folk-tales-Level-1.jpg', 'Level 1 Folk Tale Readers (Pack of 6)', 2200, 'readers', 'FT001'],

  // Yellow Level 2
  ['Readers/Yellow/L2-Yellow-Reader-Set-1-Inky-Mouse-and-Friends.jpg', 'Level 2 Inky and Friends (Pack of 6)', 2000, 'readers', 'YL201'],
  ['Readers/Yellow/L2-Yellow-Reader-Set-2-General-Fiction.jpg', 'Level 2 General Fiction (Pack of 6)', 2000, 'readers', 'YL202'],
  ['Readers/Yellow/L2-Yellow-Reader-Set-3-Nonfiction.jpg', 'Level 2 Non-Fiction (Pack of 6)', 2000, 'readers', 'YL203'],
  ['Readers/Yellow/L2-Yellow-Reader-Complete-Set.jpg', 'Level 2 Yellow Readers Complete Set', 0, 'readers', 'YLSET'],
  ['Readers/FolkTales/Folk-tales-Level-2.jpg', 'Level 2 Folk Tale Readers (Pack of 6)', 2400, 'readers', 'FT002'],

  // Green Level 3
  ['Readers/Green/L3-Green-Reader-Set-1-Inky-Mouse-and-Friends.jpg', 'Level 3 Inky and Friends (Pack of 6)', 2200, 'readers', 'GR301'],
  ['Readers/Green/L3-Green-Reader-Set-2-General-Fiction.jpg', 'Level 3 General Fiction (Pack of 6)', 2200, 'readers', 'GR302'],
  ['Readers/Green/L3-Green-Reader-Set-3-Nonfiction.jpg', 'Level 3 Non-Fiction (Pack of 6)', 2200, 'readers', 'GR303'],
  ['Readers/Green/L3-Green-Reader-Complete-Set.jpg', 'Level 3 Green Readers Complete Set', 0, 'readers', 'GRSET'],
  ['Readers/FolkTales/Folk-tales-Level-3.jpg', 'Level 3 Folk Tale Readers (Pack of 6)', 2600, 'readers', 'FT003'],

  // Blue Level 4
  ['Readers/Blue/L4-Blue-Reader-Set-1-Inky-Mouse-and-Friends.jpg', 'Level 4 Inky and Friends (Pack of 6)', 2200, 'readers', 'BL401'],
  ['Readers/Blue/L4-Blue-Reader-Set-2-General-Fiction.jpg', 'Level 4 General Fiction (Pack of 6)', 2200, 'readers', 'BL402'],
  ['Readers/Blue/L4-Blue-Reader-Set-3-Nonfiction.jpg', 'Level 4 Non-Fiction (Pack of 6)', 2200, 'readers', 'BL403'],
  ['Readers/Blue/L4-Blue-Reader-Complete-Set.jpg', 'Level 4 Blue Readers Complete Set', 0, 'readers', 'BLSET'],
  ['Readers/FolkTales/Folk-tales-Level-4.jpg', 'Level 4 Folk Tale Readers (Pack of 6)', 2600, 'readers', 'FT004'],

  // Purple Level 5
  ['Readers/Purple level/Purple-Reader-inky.jpg', 'Level 5 Inky and Friends (Pack of 6)', 2200, 'readers', 'PU501'],
  ['Readers/Purple level/Purple-Reader-gen-fiction.jpg', 'Level 5 General Fiction (Pack of 6)', 2200, 'readers', 'PU502'],
  ['Readers/Purple level/Purple-Reader-non-fiction.jpg', 'Level 5 Non-Fiction (Pack of 6)', 2200, 'readers', 'PU503'],
  ['Readers/Purple level/Purple-Reader- complete-set.jpg', 'Level 5 Purple Readers Complete Set', 0, 'readers', 'PUSET'],
  ['Readers/FolkTales/Folk-tales-Level-5.jpg', 'Level 5 Folk Tale Readers (Pack of 6)', 2800, 'readers', 'FT005'],

  // Our World Readers
  ['Readers/OurWorld/L1-Red-Our-World-Readers-Complete-Set.jpg', 'Our World Red Readers Complete Set', 0, 'readers', 'OWR1'],
  ['Readers/OurWorld/L2-Yellow-Our-World-Readers-Complete-Set.jpg', 'Our World Yellow Readers Complete Set', 0, 'readers', 'OWR2'],
  ['Readers/OurWorld/L4-Blue-Our-World-Readers-Complete-Set.jpeg', 'Our World Blue Readers Complete Set', 0, 'readers', 'OWR4'],
  ['Readers/OurWorld/L5-Purple-Our-World-Readers-Complete-Set.jpg', 'Our World Purple Readers Complete Set', 0, 'readers', 'OWR5'],
]

/** Price list items without matching images — for admin to add later */
export const PRICELIST_WITHOUT_IMAGES = [
  'Fun Phonics Pack 1 (Group 1-3 Sounds) — PKR 500',
  'Fun Phonics Pack 2 (Group 4-7 Sounds) — PKR 500',
  'Finger Phonics Big Books Set 1-7 — PKR 32,000',
  'Activity Books 1-7 Set (Old Version) — PKR 10,400',
  'Activity Book 1-7 Single (Old Version) — PKR 1,490 each',
  'Read and See Pack 1 and 2 Combined — PKR 8,085',
  'The Grammar Handbook 1-6 — PKR 4,500',
  'Jolly Grammar Big Book 1 — PKR 14,500',
  'Jolly Grammar Big Book 2 — PKR 14,500',
  'Letter Sound Strip (Single) — PKR 200',
  'Magnetic Letters (Tub of 106) — PKR 12,500',
  'Blends Wheel (Single) — PKR 750',
  'Tricky Word Wall Flowers — PKR 8,000',
  'Puppets Set of All 3 — PKR 36,000',
  'Resources CD — PKR 4,500',
  'Sounds Like Fun DVD — PKR 5,300',
  'Bumper Book — PKR 17,000',
  'Grammar Games CD (Single User) — PKR 7,250',
]

/** Images that need manual review */
export const IMAGES_NEED_REVIEW = [
  'Readers/OurWorld/L3-Green-Our-World-Readers-Complete-Set (no file extension)',
]
