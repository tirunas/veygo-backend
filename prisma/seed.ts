import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedDestination {
  id: string;
  name: string;
  country: string;
  styles: string[];
  bestSeason: string;
  imgUrl: string;
  heroImageUrl: string;
  currentWeather: string;
  content: Record<string, unknown>;
}

const destinations: SeedDestination[] = [
  {
    id: 'barcelona',
    name: 'Barselona',
    country: 'Ispanija',
    styles: ['culture', 'food', 'city', 'beach'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&q=85',
    currentWeather: '22°C',
    content: {
      description: 'Katalonijos sostinė — miestas su unikaliu charakteriu.',
      highlights: ['Sagrada Familia', 'Park Güell', 'La Boqueria', 'Gotikinis kvartalas'],
      flightHours: 3.5,
      minDailyBudget: 60,
      startingPrice: 1230,
    },
  },
  {
    id: 'lisbon',
    name: 'Lisabona',
    country: 'Portugalija',
    styles: ['culture', 'city', 'food'],
    bestSeason: 'Kovas – Gegužė',
    imgUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=1920&q=85',
    currentWeather: '18°C',
    content: {
      description: 'Europos seniausias sostinių miestas ant septynių kalvų.',
      highlights: ['Alfama', 'Belėmo bokštas', 'Jerónimos vienuolynas', 'LX Factory'],
      flightHours: 4,
      minDailyBudget: 50,
      startingPrice: 980,
    },
  },
  {
    id: 'kyoto',
    name: 'Kiotas',
    country: 'Japonija',
    styles: ['culture', 'nature', 'history'],
    bestSeason: 'Kovas – Gegužė',
    imgUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=85',
    currentWeather: '16°C',
    content: {
      description: 'Senoji Japonijos sostinė, tūkstančio šventyklų miestas.',
      highlights: ['Fushimi Inari', 'Arašijama bambukų miškas', 'Kinkaku-ji', 'Gion kvartalas'],
      flightHours: 11,
      minDailyBudget: 70,
      startingPrice: 2100,
    },
  },
  {
    id: 'marrakech',
    name: 'Marakesas',
    country: 'Marokas',
    styles: ['culture', 'food', 'history'],
    bestSeason: 'Spalis – Lapkritis',
    imgUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&q=85',
    currentWeather: '28°C',
    content: {
      description: 'Raudonasis miestas — spalvų, kvapų ir garsų simfonija.',
      highlights: ['Djemaa el-Fna', 'Medina', 'Majorelle sodas', 'Soukų turgus'],
      flightHours: 5,
      minDailyBudget: 40,
      startingPrice: 890,
    },
  },
  {
    id: 'porto',
    name: 'Portas',
    country: 'Portugalija',
    styles: ['culture', 'food', 'city'],
    bestSeason: 'Gegužė – Rugsėjis',
    imgUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=1920&q=85',
    currentWeather: '17°C',
    content: {
      description: 'Azulejo plytelių miestas prie Douro upės.',
      highlights: ['Ribeira', 'Dom Luís tiltas', 'Porto vinai', 'Livraria Lello'],
      flightHours: 4,
      minDailyBudget: 45,
      startingPrice: 920,
    },
  },
  {
    id: 'dubrovnik',
    name: 'Dubrovnikas',
    country: 'Kroatija',
    styles: ['beach', 'history', 'culture'],
    bestSeason: 'Birželis – Rugpjūtis',
    imgUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920&q=85',
    currentWeather: '24°C',
    content: {
      description: 'Adrijos jūros perlas — Senasis miestas su galingomis sienomis.',
      highlights: ['Senojo miesto sienos', 'Stradun gatvė', 'Lokrum sala', 'Žygis kalnais'],
      flightHours: 2.5,
      minDailyBudget: 70,
      startingPrice: 1350,
    },
  },
  {
    id: 'rome',
    name: 'Roma',
    country: 'Italija',
    styles: ['culture', 'history', 'food'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1920&q=85',
    currentWeather: '20°C',
    content: {
      description: 'Amžinasis miestas — du tūkstančiai metų istorijos kiekvienoje gatvėje.',
      highlights: ['Koliziejus', 'Vatikanas', 'Trevi fontanas', 'Forumas'],
      flightHours: 3,
      minDailyBudget: 65,
      startingPrice: 1150,
    },
  },
  {
    id: 'paris',
    name: 'Paryžius',
    country: 'Prancūzija',
    styles: ['culture', 'food', 'city', 'history'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=85',
    currentWeather: '15°C',
    content: {
      description: 'Šviesos miestas — meno, mados ir gastronomijos sostinė.',
      highlights: ['Eifelio bokštas', 'Luvras', 'Monmarras', 'Notre-Dame'],
      flightHours: 3,
      minDailyBudget: 80,
      startingPrice: 1280,
    },
  },
  {
    id: 'amsterdam',
    name: 'Amsterdamas',
    country: 'Nyderlandai',
    styles: ['culture', 'city', 'history'],
    bestSeason: 'Balandis – Gegužė',
    imgUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1920&q=85',
    currentWeather: '12°C',
    content: {
      description: 'Kanalų miestas — dviračiai, muziejai ir tulpių laukai.',
      highlights: ['Rijksmuseum', 'Ano Frank namai', 'Kanalai', 'Keukenhof tulpės'],
      flightHours: 2.5,
      minDailyBudget: 75,
      startingPrice: 1180,
    },
  },
  {
    id: 'prague',
    name: 'Praga',
    country: 'Čekija',
    styles: ['culture', 'history', 'city'],
    bestSeason: 'Gegužė – Rugsėjis',
    imgUrl: 'https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85',
    currentWeather: '13°C',
    content: {
      description: 'Šimtų bokštų miestas — viduramžių architektūros šedevras.',
      highlights: ['Senamiesčio aikštė', 'Prahos pilis', 'Karlov tiltas', 'Josefov kvartalas'],
      flightHours: 2,
      minDailyBudget: 45,
      startingPrice: 850,
    },
  },
  {
    id: 'athens',
    name: 'Atėnai',
    country: 'Graikija',
    styles: ['culture', 'history', 'food'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920&q=85',
    currentWeather: '22°C',
    content: {
      description: 'Demokratijos lopšys — du su puse tūkstančio metų istorija.',
      highlights: ['Akropolis', 'Partenonas', 'Plaka kvartalas', 'Nacionalinis muziejus'],
      flightHours: 3.5,
      minDailyBudget: 55,
      startingPrice: 1050,
    },
  },
  {
    id: 'budapest',
    name: 'Budapeštas',
    country: 'Vengrija',
    styles: ['culture', 'history', 'city'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85',
    currentWeather: '14°C',
    content: {
      description: 'Dunojaus perlai — Budas ir Peštas, sujungti tilto.',
      highlights: ['Parlamento rūmai', 'Termaliniai vonios', 'Žvejų bastionas', 'Ruin bariai'],
      flightHours: 2,
      minDailyBudget: 45,
      startingPrice: 880,
    },
  },
  {
    id: 'tenerife',
    name: 'Tenerifė',
    country: 'Ispanija',
    styles: ['beach', 'nature', 'city'],
    bestSeason: 'Lapkritis – Kovas',
    imgUrl: 'https://images.unsplash.com/photo-1512253037373-90bdc4c43a8b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1512253037373-90bdc4c43a8b?w=1920&q=85',
    currentWeather: '25°C',
    content: {
      description: 'Amžinojo pavasario sala — Teide ugnikalnio šešėlyje.',
      highlights: ['Teide nacionalinis parkas', 'Los Gigantes uolos', 'Anaga miškas', 'Santa Cruz karnavalai'],
      flightHours: 5,
      minDailyBudget: 60,
      startingPrice: 1100,
    },
  },
  {
    id: 'santorini',
    name: 'Santorinis',
    country: 'Graikija',
    styles: ['beach', 'culture', 'romantic'],
    bestSeason: 'Gegužė – Rugsėjis',
    imgUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=85',
    currentWeather: '23°C',
    content: {
      description: 'Baltų kupolų ir mėlyno dangaus ikona — Egėjo jūroje.',
      highlights: ['Oia saulėlydis', 'Fira miestelis', 'Raudonasis paplūdimys', 'Vulkano ekskursija'],
      flightHours: 4,
      minDailyBudget: 90,
      startingPrice: 1650,
    },
  },
  {
    id: 'vienna',
    name: 'Viena',
    country: 'Austrija',
    styles: ['culture', 'history', 'city'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1920&q=85',
    currentWeather: '14°C',
    content: {
      description: 'Imperijos sostinė — muzikos, meno ir kavos kultūros centras.',
      highlights: ['Schönbrunno rūmai', 'Stephansdom', 'Kunsthistorisches muziejus', 'Prateris'],
      flightHours: 2.5,
      minDailyBudget: 65,
      startingPrice: 1100,
    },
  },
  {
    id: 'berlin',
    name: 'Berlynas',
    country: 'Vokietija',
    styles: ['culture', 'history', 'city'],
    bestSeason: 'Birželis – Rugpjūtis',
    imgUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1920&q=85',
    currentWeather: '11°C',
    content: {
      description: 'Kūrybos ir istorijos miestas — sienų griūtis ir naujoji Europa.',
      highlights: ['Berlyno sienos memorialas', 'Brandenburgo vartai', 'Muziejų sala', 'Kreuzberg kvartalas'],
      flightHours: 2,
      minDailyBudget: 55,
      startingPrice: 980,
    },
  },
  {
    id: 'bali',
    name: 'Balis',
    country: 'Indonezija',
    styles: ['beach', 'nature', 'culture'],
    bestSeason: 'Balandis – Spalis',
    imgUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&q=85',
    currentWeather: '29°C',
    content: {
      description: 'Dievų sala — ryžių terasos, šventyklos ir vandenynas.',
      highlights: ['Ubudo ryžių terasos', 'Tanah Lot šventykla', 'Seminyak paplūdimys', 'Monkey Forest'],
      flightHours: 13,
      minDailyBudget: 35,
      startingPrice: 1800,
    },
  },
  {
    id: 'tbilisi',
    name: 'Tbilisis',
    country: 'Gruzija',
    styles: ['culture', 'history', 'food'],
    bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1567591370978-f3286bfc00a1?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1567591370978-f3286bfc00a1?w=1920&q=85',
    currentWeather: '17°C',
    content: {
      description: 'Senovinis Kaukazo miestas — vynas, khinkali ir sieros vonios.',
      highlights: ['Narikala tvirtovė', 'Sioni katedra', 'Abanotubani sieros vonios', 'Rustaveli prospektas'],
      flightHours: 4,
      minDailyBudget: 30,
      startingPrice: 750,
    },
  },
];

async function main() {
  console.log('Seeding destinations...');

  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { id: destination.id },
      update: destination,
      create: destination,
    });
    console.log(`  ✓ ${destination.name}`);
  }

  console.log(`\nDone. Seeded ${destinations.length} destinations.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
