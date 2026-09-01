export const FIRST_NAMES = [
  'Kwame', 'Abena', 'Kofi', 'Emmanuel', 'Rita', 'Daniel', 'Grace', 'Belinda', 'Bob', 'Frank',
  'Mercy', 'Yaw', 'Samuel', 'Evelyn', 'Prince', 'Patricia', 'Cynthia', 'Derrick', 'Linda', 'Joseph',
  'Adu', 'Mensah', 'Richmond', 'Vida', 'Eric', 'Faustina', 'Gideon', 'Harriet', 'Isaac', 'Joyce',
  'Kelvin', 'Lydia', 'Michael', 'Naomi', 'Oliver', 'Peter', 'Richard', 'Sandra', 'Thomas', 'Victor',
  'Winfred', 'Yvonne', 'Gladys', 'Bright', 'Charles', 'Diana', 'Ernest', 'Felicia', 'Gabriel', 'Hannah',
  'Ibrahim', 'Janet', 'Kingsley', 'Lucy', 'Matthew', 'Nancy', 'Osei', 'Patience', 'Robert', 'Stella',
  'Theophilus', 'Victoria', 'William', 'Agnes', 'Bernard', 'Catherine', 'David', 'Elizabeth', 'Francis', 'Georgina',
  'Henry', 'Irene', 'James', 'Karen', 'Lawrence', 'Mary', 'Nicholas', 'Ophelia', 'Paul', 'Rebecca',
  'Stephen', 'Theresa', 'Vincent', 'Alex', 'Beatrice', 'Christopher', 'Deborah', 'Edward', 'Florence', 'George',
  'Helena', 'Kenneth', 'Martin', 'Nora', 'Patrick', 'Rachel', 'Simon', 'Tina', 'Walter', 'Anita',
  'Benjamin', 'Clara', 'Dennis', 'Esther', 'Felix', 'Gloria', 'Harrison', 'Isabel', 'Jacob', 'Leonard',
  'Monica', 'Nathan', 'Philip', 'Ruth', 'Timothy', 'Veronica', 'Arthur', 'Brenda', 'Caleb', 'Doris',
  'Eugene', 'Fiona', 'Gregory', 'Helen', 'Julia', 'Luke', 'Martha', 'Noah', 'Pamela', 'Raymond',
  'Sarah', 'Brian', 'Charlotte', 'John', 'Kate', 'Louis', 'Margaret', 'Olivia', 'Sam', 'Tracy',
  'Gerald', 'Mark', 'Oscar', 'Ralph', 'Wayne', 'Adam', 'Gary', 'Jack', 'Kelly', 'Leo',
  'Megan', 'Neil', 'Paula', 'Roy', 'Harry', 'Dan', 'Ken', 'Max', 'Mia', 'Zoe',
  'Adwoa', 'Kwaku', 'Kwadwo', 'Kwabena', 'Kweku', 'Kobina', 'Akosua', 'Akua', 'Yaa', 'Afua',
  'Afia', 'Ama', 'Nana', 'Kojo', 'Baah', 'Boadu', 'Boateng', 'Frimpong', 'Gyamfi', 'Ofori',
  'Owusu', 'Sarpong', 'Yeboah', 'Acheampong', 'Adomako', 'Agyemang', 'Allotey', 'Amankwah', 'Annan',
  'Ansah', 'Antwi', 'Arhin', 'Asamoah', 'Atta', 'Badu', 'Baffoe', 'Boakye', 'Bonsu', 'Darko',
  'Donkor', 'Egyir', 'Eshun', 'Forson', 'Gaisie', 'Kyei', 'Lamptey', 'Lartey', 'Nartey', 'Ntim',
  'Nyarko', 'Ocloo', 'Okyere', 'Oppong', 'Quaye', 'Sackey', 'Tetteh', 'Turkson', 'Amponsah', 'Andoh',
  'Appenteng', 'Asiedu', 'Ayew', 'Bediako', 'Boahin', 'Doku', 'Duah', 'Fosu', 'Hayford', 'Issah',
  'Koomson', 'Kusi', 'Marfo', 'Mireku', 'Morgan', 'Nanfuri', 'Nduom', 'Nketia', 'Nsiah', 'Obiri',
  'Poku', 'Prempeh', 'Siaw', 'Sefa', 'Sekyi', 'Sowah', 'Tagoe', 'Tandoh', 'Tawiah', 'Wiafe', 'Yankson'
];

export const SURNAMES = [
  'Agyekum', 'Mensah', 'Boateng', 'Osei', 'Appiah', 'Owusu', 'Frimpong', 'Asante', 'Kwarteng',
  'Yeboah', 'Acheampong', 'Boakye', 'Sarpong', 'Darko', 'Oppong', 'Adom', 'Amankwah', 'Gyamfi',
  'Donkor', 'Bonsu', 'Tetteh', 'Lamptey', 'Quaye', 'Lartey', 'Sackey', 'Annan', 'Antwi', 'Kyei',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor',
  'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott'
];

export const PHONE_PREFIXES = ['024', '054', '055', '059', '020', '050', '027', '057', '026'];

// Combined Pool for legacy compatibility
export const USERNAMES_POOL = FIRST_NAMES;

const recentNamesMemory = [];
const MAX_RECENT_HISTORY = 40;

/**
 * Generates a unique, non-repeating username or masked identity
 */
export function getUniqueDynamicName() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const styleChoice = Math.random();
    let candidate = '';

    if (styleChoice < 0.35) {
      // Style 1: First Name + Initial (e.g. Kwame A., Belinda M.)
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      candidate = `${first} ${initial}.`;
    } else if (styleChoice < 0.65) {
      // Style 2: First Name + Surname (e.g. Kofi Mensah, Daniel Boateng)
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
      candidate = `${first} ${last}`;
    } else if (styleChoice < 0.85) {
      // Style 3: Username handle with digits or tags (e.g. Emmanuel_92, Alex_Crypto, Nana_88)
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const suffix = Math.random() > 0.4 
        ? Math.floor(10 + Math.random() * 90) 
        : ['Pro', 'Miner', 'Hash', 'Crypto', 'VIP', 'Gold'][Math.floor(Math.random() * 6)];
      candidate = `${first}_${suffix}`;
    } else {
      // Style 4: Masked Phone identity (e.g. 024****918, 055****342)
      const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
      const last3 = Math.floor(100 + Math.random() * 900);
      candidate = `${prefix}****${last3}`;
    }

    if (!recentNamesMemory.includes(candidate)) {
      recentNamesMemory.push(candidate);
      if (recentNamesMemory.length > MAX_RECENT_HISTORY) {
        recentNamesMemory.shift();
      }
      return candidate;
    }
  }

  // Fallback guaranteed unique with random entropy
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${first}_${num}`;
}
