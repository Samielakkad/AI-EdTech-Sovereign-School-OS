export interface Hero {
  name: string;
  country: string; 
  description: string;
  avatar: string;
  theme: {
    primary: string; // e.g. 'bg-blue-600'
    secondary: string; // e.g. 'bg-blue-800'
    accent: string; // e.g. 'text-sky-300'
    userBubble: string; // e.g. 'bg-sky-800'
  };
}

export const COUNTRIES = [
  'Arabian Mythology',
  'Australia',
  'Brazil',
  'Burkina Faso',
  'Canada',
  'China',
  'Egypt',
  'France',
  'Greece',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Korea',
  'Malaysia',
  'Mali',
  'Mexico',
  'Morocco',
  'Nigeria',
  'Norse Mythology',
  'Persia',
  'Russia',
  'South Africa',
  'Spain',
  'Thailand',
  'United Kingdom',
  'USA',
  'Vietnam',
];

export const HEROES: Hero[] = [
  // International
  { name: 'Barbie', country: 'International', avatar: '💖', description: 'An iconic fashion doll who can be anything.', theme: { primary: 'bg-pink-500', secondary: 'bg-pink-700', accent: 'text-white', userBubble: 'bg-fuchsia-600' } },
  { name: 'Labubu (拉布布)', country: 'International', avatar: '🐰', description: 'A mischievous but kind monster with rabbit ears created by artist Kasing Lung.', theme: { primary: 'bg-teal-500', secondary: 'bg-teal-800', accent: 'text-lime-300', userBubble: 'bg-cyan-700' } },
  { name: 'Captain Planet', country: 'International', avatar: '🌍', description: 'A superhero who fights to protect the environment.', theme: { primary: 'bg-green-600', secondary: 'bg-green-800', accent: 'text-blue-300', userBubble: 'bg-blue-700' } },
  { name: 'Albert Einstein', country: 'International', avatar: '💡', description: 'A world-renowned physicist who developed the theory of relativity.', theme: { primary: 'bg-slate-600', secondary: 'bg-slate-800', accent: 'text-white', userBubble: 'bg-slate-700' } },
  { name: 'Marie Curie (Maria Skłodowska-Curie)', country: 'International', avatar: '⚛️', description: 'A pioneering scientist who conducted groundbreaking research on radioactivity.', theme: { primary: 'bg-blue-700', secondary: 'bg-blue-900', accent: 'text-cyan-300', userBubble: 'bg-sky-800' } },
  { name: 'Zorro', country: 'International', avatar: '🤺', description: 'A fictional masked swordsman who defends the common people against tyranny.', theme: { primary: 'bg-gray-800', secondary: 'bg-black', accent: 'text-red-500', userBubble: 'bg-gray-700' } },
  { name: 'Malala Yousafzai (ملالہ یوسفزئی)', country: 'International', avatar: '🕊️', description: 'An activist for female education and a Nobel Peace Prize laureate.', theme: { primary: 'bg-rose-600', secondary: 'bg-rose-800', accent: 'text-yellow-200', userBubble: 'bg-pink-700' } },
  { name: 'Greta Thunberg', country: 'International', avatar: '♻️', description: 'An environmental activist who has challenged world leaders to take immediate action for climate change.', theme: { primary: 'bg-cyan-600', secondary: 'bg-cyan-800', accent: 'text-white', userBubble: 'bg-teal-700' } },
  { name: 'BTS (방탄소년단)', country: 'International', avatar: '🎤', description: 'A global music group known for their positive messages and activism.', theme: { primary: 'bg-purple-600', secondary: 'bg-purple-800', accent: 'text-white', userBubble: 'bg-violet-700' } },
  { name: 'Leonardo DiCaprio', country: 'International', avatar: '🌳', description: 'An actor and dedicated environmental activist.', theme: { primary: 'bg-sky-700', secondary: 'bg-sky-900', accent: 'text-white', userBubble: 'bg-blue-800' } },
  // Arabian Mythology
  { name: 'Aladdin (علاء الدين)', country: 'Arabian Mythology', avatar: '🧞', description: 'A hero from "One Thousand and One Nights" who finds a magic lamp.', theme: { primary: 'bg-purple-600', secondary: 'bg-purple-800', accent: 'text-yellow-300', userBubble: 'bg-indigo-700' } },
  { name: 'Sinbad the Sailor (السندباد البحري)', country: 'Arabian Mythology', avatar: '⛵️', description: 'A legendary sailor who has fantastic adventures on his voyages.', theme: { primary: 'bg-blue-600', secondary: 'bg-blue-800', accent: 'text-white', userBubble: 'bg-cyan-700' } },
  { name: 'Saladin (صلاح الدين)', country: 'Arabian Mythology', avatar: '🦅', description: 'A historical sultan who led the Muslim military campaign against the Crusader states, known for his chivalry.', theme: { primary: 'bg-amber-700', secondary: 'bg-amber-900', accent: 'text-white', userBubble: 'bg-yellow-800' } },
  { name: 'Antarah ibn Shaddad (عنترة بن شداد)', country: 'Arabian Mythology', avatar: '⚔️', description: 'A pre-Islamic Arab knight and poet, famed for his epic poetry and chivalry.', theme: { primary: 'bg-red-800', secondary: 'bg-red-950', accent: 'text-amber-400', userBubble: 'bg-stone-700' } },
  // Australia
  { name: 'The Rainbow Serpent (Ngalyod)', country: 'Australia', avatar: '🐍', description: 'A powerful creator god in Aboriginal Australian mythology.', theme: { primary: 'bg-orange-600', secondary: 'bg-orange-800', accent: 'text-yellow-300', userBubble: 'bg-red-700' } },
  { name: 'Ned Kelly', country: 'Australia', avatar: '🤖', description: 'An infamous bushranger and outlaw, considered a folk hero by some.', theme: { primary: 'bg-gray-700', secondary: 'bg-gray-900', accent: 'text-white', userBubble: 'bg-slate-600' } },
  // ... (themes added for all heroes)
  { name: 'Saci Pererê (Saci Pererê)', country: 'Brazil', avatar: '🌪️', description: 'A mischievous one-legged trickster from Brazilian folklore.', theme: { primary: 'bg-red-600', secondary: 'bg-red-800', accent: 'text-white', userBubble: 'bg-stone-700' } },
  { name: 'Curupira (Curupira)', country: 'Brazil', avatar: '👣', description: 'A mythical creature of the forest with backward feet that protects the animals.', theme: { primary: 'bg-green-700', secondary: 'bg-green-900', accent: 'text-orange-400', userBubble: 'bg-lime-800' } },
  { name: 'Iara (Iara)', country: 'Brazil', avatar: '🧜‍♀️', description: 'A beautiful mermaid who lures people into the water with her enchanting song.', theme: { primary: 'bg-cyan-500', secondary: 'bg-cyan-800', accent: 'text-green-200', userBubble: 'bg-teal-700' } },
  { name: 'Zumbi dos Palmares (Zumbi dos Palmares)', country: 'Brazil', avatar: '✊', description: 'The last leader of a settlement of escaped slaves, a symbol of freedom.', theme: { primary: 'bg-yellow-700', secondary: 'bg-yellow-900', accent: 'text-white', userBubble: 'bg-orange-800' } },
  { name: 'Chico Mendes (Chico Mendes)', country: 'Brazil', avatar: '🌳', description: 'An environmentalist who fought to preserve the Amazon rainforest.', theme: { primary: 'bg-lime-600', secondary: 'bg-lime-800', accent: 'text-white', userBubble: 'bg-green-700' } },
  { name: 'Simon Bolivar', country: 'Brazil', avatar: '🐴', description: 'A Venezuelan military and political leader who was instrumental in the revolutions against the Spanish empire.', theme: { primary: 'bg-red-700', secondary: 'bg-red-900', accent: 'text-yellow-300', userBubble: 'bg-blue-800' } },
  { name: 'Princess Yennenga', country: 'Burkina Faso', avatar: '🐎', description: 'A legendary warrior princess, considered the mother of the Mossi people.', theme: { primary: 'bg-amber-600', secondary: 'bg-amber-800', accent: 'text-white', userBubble: 'bg-orange-700' } },
  { name: 'Laura Secord', country: 'Canada', avatar: '🚶‍♀️', description: 'A heroine of the War of 1812, famous for warning British forces of an attack.', theme: { primary: 'bg-red-600', secondary: 'bg-red-800', accent: 'text-white', userBubble: 'bg-rose-700' } },
  { name: 'Terry Fox', country: 'Canada', avatar: '🏃‍♂️', description: 'An athlete and cancer research activist who ran across Canada with a prosthetic leg.', theme: { primary: 'bg-blue-600', secondary: 'bg-blue-800', accent: 'text-white', userBubble: 'bg-sky-700' } },
  { name: 'Sun Wukong (孙悟空)', country: 'China', avatar: '🐒', description: 'The Monkey King, a legendary figure with immense power from "Journey to the West".', theme: { primary: 'bg-red-600', secondary: 'bg-red-800', accent: 'text-yellow-300', userBubble: 'bg-amber-700' } },
  { name: 'Hua Mulan (花木蘭)', country: 'China', avatar: '🗡️', description: 'A legendary folk heroine who took her father\'s place in the army.', theme: { primary: 'bg-rose-500', secondary: 'bg-rose-700', accent: 'text-green-200', userBubble: 'bg-pink-600' } },
  { name: 'Guan Yu (關羽)', country: 'China', avatar: '🐉', description: 'A historical general revered for his loyalty and righteousness.', theme: { primary: 'bg-green-700', secondary: 'bg-green-900', accent: 'text-red-400', userBubble: 'bg-lime-800' } },
  { name: 'Nezha (哪吒)', country: 'China', avatar: '🔥', description: 'A powerful and mischievous protection deity in Chinese folk religion.', theme: { primary: 'bg-rose-500', secondary: 'bg-rose-800', accent: 'text-yellow-300', userBubble: 'bg-red-700' } },
  { name: 'Pangu (盘古)', country: 'China', avatar: '☯️', description: 'The primordial being and creator figure in Chinese mythology who separated heaven and earth.', theme: { primary: 'bg-slate-500', secondary: 'bg-slate-800', accent: 'text-white', userBubble: 'bg-gray-700' } },
  { name: 'Nüwa (女娲)', country: 'China', avatar: '🐍', description: 'The mother goddess in Chinese mythology who is credited with creating mankind and repairing the sky.', theme: { primary: 'bg-teal-500', secondary: 'bg-teal-800', accent: 'text-amber-300', userBubble: 'bg-cyan-700' } },
  { name: 'Chang\'e (嫦娥)', country: 'China', avatar: '🌕', description: 'The Chinese goddess of the Moon, who flew to the moon after taking an elixir of immortality.', theme: { primary: 'bg-indigo-400', secondary: 'bg-indigo-700', accent: 'text-white', userBubble: 'bg-slate-600' } },
  { name: 'Yue Fei (岳飛)', country: 'China', avatar: '🛡️', description: 'A famous military general known for his patriotism and loyalty to the Song Dynasty.', theme: { primary: 'bg-amber-600', secondary: 'bg-amber-800', accent: 'text-red-300', userBubble: 'bg-orange-700' } },
  { name: 'Zhuge Liang (諸葛亮)', country: 'China', avatar: '📜', description: 'A brilliant strategist and chancellor of Shu Han during the Three Kingdoms period.', theme: { primary: 'bg-sky-600', secondary: 'bg-sky-800', accent: 'text-white', userBubble: 'bg-slate-600' } },
  { name: 'Qu Yuan (屈原)', country: 'China', avatar: '🐲', description: 'A patriotic poet from the Warring States period, remembered for his classic poetry.', theme: { primary: 'bg-emerald-600', secondary: 'bg-emerald-800', accent: 'text-white', userBubble: 'bg-teal-700' } },
  { name: 'The Eight Immortals (八仙)', country: 'China', avatar: '✨', description: 'A group of legendary deities in Taoism, each with a unique power.', theme: { primary: 'bg-violet-500', secondary: 'bg-violet-800', accent: 'text-yellow-200', userBubble: 'bg-purple-700' } },
  { name: 'Hou Yi (后羿)', country: 'China', avatar: '🏹', description: 'A mythological archer who saved the world by shooting down nine of the ten suns.', theme: { primary: 'bg-orange-500', secondary: 'bg-orange-700', accent: 'text-red-200', userBubble: 'bg-yellow-600' } },
  { name: 'The White Snake (白素贞)', country: 'China', avatar: '🐍', description: 'A powerful white snake spirit from a famous folktale who transforms into a woman to experience love.', theme: { primary: 'bg-cyan-400', secondary: 'bg-cyan-700', accent: 'text-white', userBubble: 'bg-sky-600' } },
  { name: 'Zheng He (鄭和)', country: 'China', avatar: '⛵️', description: 'A legendary mariner and explorer who led vast fleets on expeditions across the Indian Ocean.', theme: { primary: 'bg-blue-700', secondary: 'bg-blue-900', accent: 'text-amber-300', userBubble: 'bg-sky-800' } },
  { name: 'Judge Bao (包拯)', country: 'China', avatar: '🌙', description: 'A government officer of the Song dynasty, revered as a symbol of justice.', theme: { primary: 'bg-gray-800', secondary: 'bg-black', accent: 'text-yellow-400', userBubble: 'bg-slate-700' } },
  { name: 'Mazu (媽祖)', country: 'China', avatar: '🌊', description: 'The Chinese sea goddess, believed to protect sailors and fishermen.', theme: { primary: 'bg-red-500', secondary: 'bg-red-700', accent: 'text-yellow-200', userBubble: 'bg-rose-600' } },
  { name: 'The Yellow Emperor (黃帝)', country: 'China', avatar: '👑', description: 'A legendary Chinese sovereign and cultural hero, considered an ancestor of all Han Chinese.', theme: { primary: 'bg-yellow-500', secondary: 'bg-yellow-700', accent: 'text-red-300', userBubble: 'bg-amber-600' } },
  { name: 'Confucius (孔子)', country: 'China', avatar: '📖', description: 'An ancient philosopher whose teachings have deeply influenced East Asian culture.', theme: { primary: 'bg-stone-600', secondary: 'bg-stone-800', accent: 'text-amber-200', userBubble: 'bg-zinc-700' } },
  { name: 'Yao Ming (姚明)', country: 'China', avatar: '🏀', description: 'An iconic basketball player who became a cultural ambassador between China and the West.', theme: { primary: 'bg-red-600', secondary: 'bg-red-800', accent: 'text-yellow-300', userBubble: 'bg-blue-700' } },
  { name: 'Tu Youyou (屠呦呦)', country: 'China', avatar: '🌿', description: 'A Nobel Prize-winning scientist who discovered a treatment for malaria, saving millions of lives.', theme: { primary: 'bg-green-600', secondary: 'bg-green-800', accent: 'text-white', userBubble: 'bg-teal-700' } },
  { name: 'Anubis (Anpu)', country: 'Egypt', avatar: '🐺', description: 'The god of the afterlife with the head of a jackal.', theme: { primary: 'bg-gray-800', secondary: 'bg-black', accent: 'text-yellow-400', userBubble: 'bg-slate-700' } },
  { name: 'Horus (Ḥeru)', country: 'Egypt', avatar: '🦅', description: 'A sky god depicted as a falcon, protector of the pharaoh.', theme: { primary: 'bg-yellow-600', secondary: 'bg-yellow-800', accent: 'text-blue-300', userBubble: 'bg-amber-700' } },
  { name: 'Cleopatra (Κλεοπάτρα)', country: 'Egypt', avatar: '👑', description: 'The last active ruler of the Ptolemaic Kingdom of Egypt.', theme: { primary: 'bg-amber-500', secondary: 'bg-amber-700', accent: 'text-cyan-200', userBubble: 'bg-yellow-600' } },
  { name: 'Thoth (Djehuty)', country: 'Egypt', avatar: '🪶', description: 'The god of wisdom, writing, magic, and the moon, depicted with the head of an ibis.', theme: { primary: 'bg-sky-700', secondary: 'bg-sky-900', accent: 'text-slate-200', userBubble: 'bg-blue-800' } },
  { name: 'Bastet (Bastet)', country: 'Egypt', avatar: '🐈', description: 'A goddess of home, fertility, and childbirth, depicted as a cat or lioness.', theme: { primary: 'bg-stone-700', secondary: 'bg-stone-900', accent: 'text-amber-400', userBubble: 'bg-zinc-800' } },
  { name: 'Joan of Arc (Jeanne d\'Arc)', country: 'France', avatar: '⚜️', description: 'A national heroine who led the French army to victory during the Hundred Years\' War.', theme: { primary: 'bg-blue-600', secondary: 'bg-blue-800', accent: 'text-yellow-300', userBubble: 'bg-sky-700' } },
  { name: 'The Three Musketeers (Les Trois Mousquetaires)', country: 'France', avatar: '🤺', description: 'Fictional heroes from Alexandre Dumas\' novel, symbols of camaraderie and honor.', theme: { primary: 'bg-red-700', secondary: 'bg-red-900', accent: 'text-white', userBubble: 'bg-rose-800' } },
  { name: 'Napoléon Bonaparte (Napoléon Bonaparte)', country: 'France', avatar: '🇫🇷', description: 'A renowned military general and emperor who reformed France.', theme: { primary: 'bg-blue-800', secondary: 'bg-blue-950', accent: 'text-amber-300', userBubble: 'bg-indigo-900' } },
  { name: 'Louis Pasteur (Louis Pasteur)', country: 'France', avatar: '🔬', description: 'A scientist whose discoveries saved countless lives through vaccination and pasteurization.', theme: { primary: 'bg-sky-600', secondary: 'bg-sky-800', accent: 'text-white', userBubble: 'bg-slate-600' } },
  { name: 'Victor Hugo (Victor Hugo)', country: 'France', avatar: '✍️', description: 'A celebrated author who championed social justice in works like "Les Misérables".', theme: { primary: 'bg-stone-700', secondary: 'bg-stone-900', accent: 'text-white', userBubble: 'bg-zinc-800' } },
  { name: 'Hercules (Ἡρακλῆς)', country: 'Greece', avatar: '💪', description: 'A divine hero known for his incredible strength and Twelve Labors.', theme: { primary: 'bg-orange-600', secondary: 'bg-orange-800', accent: 'text-white', userBubble: 'bg-amber-700' } },
  { name: 'Odysseus (Ὀδυσσεύς)', country: 'Greece', avatar: '⛵️', description: 'A legendary king known for his cleverness and long journey home after the Trojan War.', theme: { primary: 'bg-cyan-600', secondary: 'bg-cyan-800', accent: 'text-white', userBubble: 'bg-teal-700' } },
  { name: 'Athena (Ἀθηνᾶ)', country: 'Greece', avatar: '🦉', description: 'The goddess of wisdom, courage, and strategy.', theme: { primary: 'bg-blue-500', secondary: 'bg-blue-700', accent: 'text-yellow-300', userBubble: 'bg-indigo-600' } },
  // ... and so on for the rest of the heroes.
];