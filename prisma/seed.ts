import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, AttractionCategory, HotelTier } from '@prisma/client';
import { haversineDistanceKm } from '../src/modules/geo-matching/haversine';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new (PrismaClient as unknown as new (options?: unknown) => PrismaClient)({ adapter });

// ─── Destinations ─────────────────────────────────────────────────────────────

const destinations = [
  {
    id: 'barcelona', name: 'Barselona', country: 'Ispanija',
    styles: ['culture', 'food', 'city', 'beach'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&q=85',
    currentWeather: '22°C', lat: 41.3851, lng: 2.1734, radiusKm: 25,
    content: {
      description: 'Gaudžio architektūra, Viduržemio jūra ir kosmopolitiška energija.',
      highlights: ['Sagrada Família', 'Park Güell', 'La Boqueria', 'Barceloneta paplūdimys'],
      flightHours: 3,
      minDailyBudget: 90,
      startingPrice: 950,
      cost: { budget: '€90–120', mid: '€150–200', comfort: '€250–400' },
      tags: [
        { text: 'Gaudžio miestas', color: 'org' },
        { text: 'Paplūdimys ir architektūra', color: 'blu' },
        { text: 'Tapas kultūra', color: 'grn' },
      ],
      weather: [
        { month: 'Sausis', temp: 13, rain: 40, quality: 'ok' },
        { month: 'Vasaris', temp: 14, rain: 35, quality: 'ok' },
        { month: 'Kovas', temp: 16, rain: 40, quality: 'good' },
        { month: 'Balandis', temp: 18, rain: 45, quality: 'good' },
        { month: 'Gegužė', temp: 21, rain: 45, quality: 'best' },
        { month: 'Birželis', temp: 25, rain: 25, quality: 'best' },
        { month: 'Liepa', temp: 29, rain: 20, quality: 'best' },
        { month: 'Rugpjūtis', temp: 29, rain: 60, quality: 'good' },
        { month: 'Rugsėjis', temp: 26, rain: 65, quality: 'best' },
        { month: 'Spalis', temp: 21, rain: 80, quality: 'good' },
        { month: 'Lapkritis', temp: 16, rain: 55, quality: 'ok' },
        { month: 'Gruodis', temp: 13, rain: 45, quality: 'ok' },
      ],
      why: [
        { color: 'o', title: 'Gaudžio architektūra', description: 'Sagrada Família, Casa Batlló, Park Güell — visi per pėsčiojo atstumą. Jokiame kitame mieste nėra tokio architektūros koncentrato.' },
        { color: 'b', title: 'Paplūdimys mieste', description: 'Barceloneta yra 20 minučių nuo Gotikos rajono. Ryte muziejai, po pietų — jūra. Abu pasauliai vienoje dienoje.' },
        { color: 'g', title: 'Maistas ir rinkos', description: 'La Boqueria, tapas barų gatvės El Born rajone, šviežia jūros gėrybių pasiūla. Maistas čia yra kultūros dalis.' },
      ],
      compare: {
        without: [
          'Sagrada Família be bilieto — stosite 2–3h eilėje',
          'Park Güell monumentinė zona — ribota prieiga be bilieto',
          'Casa Batlló — galite praeiti pro šalį nematę vidaus',
          'Flamenco šou be rezervacijos vakarą — nepateksite',
        ],
        with: [
          'Sagrada Família bilietai — pirkite 3 sav. iš anksto, rinkitės laikotarpį su gido',
          'Park Güell bilietai — €10, iš anksto internetu',
          'Casa Batlló Magic Night bilietas — €45, unikalus naktinis apsilankymas',
          'Tablao Cordobes arba Los Tarantos — rezervuokite internetu',
        ],
      },
      tips: '<p>T-10 bilietas metro — 10 kelionių €11,35. Pigiausia transporto galimybė.</p><p>Gaudžio objektai — pirkite VISUS bilietus iš anksto internetu. Sagrada Família — mažiausiai 3 savaites iš anksto.</p><p>La Boqueria savaitgaliais pilna turistų — eikite darbo dienomis prieš 10:00 arba apsilankykite Mercat de Santa Caterina.</p>',
      emergency: { police: '112', ambulance: '112', embassy: '+34 93 488 2410', code: '+34', note: 'Lietuvos konsulatas Barselonoje.' },
      featuredAttractionCount: 2,
      totalAttractions: 10,
      totalFoodSpots: 10,
      soldCount: 312,
      plan: {
        destinationId: 'barcelona',
        costs: { flights: 160, hotel: 700, food: 400, transport: 60, activities: 150 },
        days: [
          {
            day: 1,
            title: 'Gaudžio architektūra',
            items: [
              { type: 'flight', name: 'Vilnius → Barselona', description: 'Ryanair · El Prat · 3 val.', price: '€70' },
              { type: 'activity', name: 'Sagrada Família', description: 'Gaudžio šedevras — nepaprastas iš bet kurio kampo.', price: '€26' },
              { type: 'activity', name: 'Casa Batlló', description: 'Nuostabi fasado detalė — žvynai ir kaukolės.', price: '€35' },
              { type: 'food', name: 'Bar Calders', description: 'Tradiciniai tapas Sant Antoni rajone.', price: '€€' },
            ],
          },
          {
            day: 2,
            title: 'Park Güell ir Barseloneta',
            items: [
              { type: 'activity', name: 'Park Güell', description: 'Mozaikinės terasos ir miesto panorama.', price: '€10' },
              { type: 'activity', name: 'Barceloneta paplūdimys', description: 'Auksinės smiltelės ir Viduržemio jūra.', price: 'Nemokama' },
              { type: 'food', name: 'La Cova Fumada', description: 'Tikras vietinis restoranas prie jūros.', price: '€€' },
            ],
          },
          {
            day: 3,
            title: 'Gotikos rajonas ir La Boqueria',
            items: [
              { type: 'activity', name: 'La Boqueria', description: 'Spalvingas turgus La Rambla gatvėje.', price: 'Nemokama' },
              { type: 'activity', name: 'Gotikos rajonas', description: 'Viduramžių labirintas — Romos laikų liekanos.', price: 'Nemokama' },
              { type: 'flight', name: 'Barselona → Vilnius', description: 'Ryanair · El Prat · 3 val.', price: '€70' },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'lisbon', name: 'Lisabona', country: 'Portugalija',
    styles: ['culture', 'city', 'food'], bestSeason: 'Kovas – Gegužė',
    imgUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=1920&q=85',
    currentWeather: '18°C', lat: 38.7169, lng: -9.1395, radiusKm: 20,
    content: {
      description: 'Tramvajai, Alfama rajonas ir pasaulio geriausias „pastel de nata".',
      highlights: ['Alfama rajonas', 'Belém bokštas', 'Jerónimos vienuolynas', 'Sintra'],
      flightHours: 3.5,
      minDailyBudget: 75,
      startingPrice: 900,
      cost: { budget: '€75–100', mid: '€130–180', comfort: '€200–320' },
      tags: [
        { text: 'Fado kultūra', color: 'org' },
        { text: 'Atradimų era', color: 'blu' },
        { text: 'Pigiausia Vakarų Europa', color: 'grn' },
      ],
      weather: [
        { month: 'Sausis', temp: 12, rain: 80, quality: 'ok' },
        { month: 'Vasaris', temp: 13, rain: 70, quality: 'ok' },
        { month: 'Kovas', temp: 15, rain: 55, quality: 'good' },
        { month: 'Balandis', temp: 18, rain: 45, quality: 'good' },
        { month: 'Gegužė', temp: 21, rain: 35, quality: 'best' },
        { month: 'Birželis', temp: 24, rain: 15, quality: 'best' },
        { month: 'Liepa', temp: 28, rain: 5, quality: 'best' },
        { month: 'Rugpjūtis', temp: 28, rain: 5, quality: 'best' },
        { month: 'Rugsėjis', temp: 25, rain: 25, quality: 'best' },
        { month: 'Spalis', temp: 20, rain: 65, quality: 'good' },
        { month: 'Lapkritis', temp: 15, rain: 100, quality: 'ok' },
        { month: 'Gruodis', temp: 12, rain: 100, quality: 'ok' },
      ],
      why: [
        { color: 'o', title: 'Pigiausia Vakarų Europoje', description: 'Puikus restoranas kainuos €12–18 asmeniui. Stovyklavimo bilietai vietiniame bare — €1,20. Lisabona suteikia Vakarų Europos patirtį už Rytų Europos kainas.' },
        { color: 'b', title: 'Istorija kiekvienoje gatvėje', description: 'Alfama išliko nepakitusi po 1755 m. žemės drebėjimo. Jerónimos vienuolynas žymi Atradimų epochą. Belém bokštas — 500 metų senas keliautojų išvykimo taškas.' },
        { color: 'g', title: 'Sintra dienos išvyka', description: 'Per 40 minučių traukiniu — romantiški rūmai, mistinės pilis ir nuostabūs sodai. Sintra yra UNESCO paveldas ir viena spalvingiausių vietų Europoje.' },
      ],
      compare: {
        without: [
          'Jerónimos vienuolynas savaitgalį — pusvalandžio eilė',
          'Belém bokštas — laukimas saulėkaitoje',
          'Sintra rūmai — kamuoja minios',
          'Fado vakaras be rezervacijos — populiariausiose vietose nebus vietų',
        ],
        with: [
          'Jerónimos — bilietai internetu iš anksto, €15',
          'Belém bokštas — anksti rytą, €8',
          'Sintra — darbo dieną, ankstyvas rytas, bilietai internetu',
          'Mesa de Frades arba Tasca do Chico — rezervuokite iš anksto',
        ],
      },
      tips: '<p>Viva Viagem kortelė — transporto kortelė, tinka autobusams, metro, tramvajams ir traukiniams į Sintrą.</p><p>28-asis tramvajus — vietinis, o ne turistinis. Važiuokite ryte, vengdami spūsties.</p><p>„Pastel de nata" — originalas tik Pastéis de Belém (nuo 1837 m.), mažiau nei 500 m nuo Jerónimos.</p>',
      emergency: { police: '112', ambulance: '112', embassy: '+351 213 822 611', code: '+351', note: 'Lietuvos ambasada Lisabonoje.' },
      featuredAttractionCount: 2,
      totalAttractions: 8,
      totalFoodSpots: 8,
      soldCount: 287,
      plan: {
        destinationId: 'lisbon',
        costs: { flights: 180, hotel: 600, food: 350, transport: 50, activities: 120 },
        days: [
          {
            day: 1,
            title: 'Alfama ir istorinis centras',
            items: [
              { type: 'flight', name: 'Vilnius → Lisabona', description: 'Ryanair · Humberto Delgado · 3,5 val.', price: '€75' },
              { type: 'activity', name: 'Alfama rajonas', description: 'Siauri maurai gatveliai, fado muzika, panoraminiai taškai.', price: 'Nemokama' },
              { type: 'activity', name: 'São Jorge pilis', description: '11 a. maurų pilis su panoraminiu vaizdu.', price: '€10' },
              { type: 'food', name: 'Time Out Market', description: 'Geriausių Lisabonos restoranų rinktinė vienoje vietoje.', price: '€€' },
            ],
          },
          {
            day: 2,
            title: 'Belém ir Sintra',
            items: [
              { type: 'activity', name: 'Jerónimos vienuolynas', description: 'Manueline architektūros šedevras, Vasco da Gama kapas.', price: '€15' },
              { type: 'activity', name: 'Belém bokštas', description: 'XVI a. tvirtovė prie Tejo upės — ikona.', price: '€8' },
              { type: 'activity', name: 'Sintra dienos išvyka', description: 'Pena rūmai ir mistiniai sodai — 40 min. traukiniu.', price: '€14' },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'kyoto', name: 'Kiotas', country: 'Japonija',
    styles: ['culture', 'nature', 'history'], bestSeason: 'Kovas – Gegužė',
    imgUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=85',
    currentWeather: '16°C', lat: 35.0116, lng: 135.7681, radiusKm: 15,
    content: {
      description: 'Šventyklos, geiša ir „sakura" žiedai — Japonijos siela.',
      highlights: ['Fushimi Inari šventykla', 'Arašijamos bambukai', 'Gion rajonas', 'Kinkaku-ji'],
      flightHours: 11,
      minDailyBudget: 100,
      startingPrice: 2200,
      cost: { budget: '€100–140', mid: '€180–250', comfort: '€320–500' },
      tags: [
        { text: 'Šventyklų miestas', color: 'org' },
        { text: 'Sakura sezonas', color: 'grn' },
        { text: 'Geiša kultūra', color: 'blu' },
      ],
      weather: [
        { month: 'Sausis', temp: 5, rain: 50, quality: 'ok' },
        { month: 'Vasaris', temp: 6, rain: 55, quality: 'ok' },
        { month: 'Kovas', temp: 10, rain: 90, quality: 'good' },
        { month: 'Balandis', temp: 16, rain: 95, quality: 'best' },
        { month: 'Gegužė', temp: 21, rain: 125, quality: 'best' },
        { month: 'Birželis', temp: 25, rain: 165, quality: 'ok' },
        { month: 'Liepa', temp: 29, rain: 190, quality: 'ok' },
        { month: 'Rugpjūtis', temp: 31, rain: 145, quality: 'ok' },
        { month: 'Rugsėjis', temp: 25, rain: 155, quality: 'good' },
        { month: 'Spalis', temp: 19, rain: 90, quality: 'best' },
        { month: 'Lapkritis', temp: 13, rain: 70, quality: 'best' },
        { month: 'Gruodis', temp: 7, rain: 50, quality: 'ok' },
      ],
      why: [
        { color: 'o', title: 'Sakura sezonas', description: 'Balandžio pradžia — vyšnių žiedai apgaubia šventyklas ir parkus rožiniu šydu. Maruyama parkas naktį su apšviesta sakura — neužmirštamas vaizdas.' },
        { color: 'b', title: '17 UNESCO objektų viename mieste', description: 'Kinkaku-ji, Ryoan-ji, Nijo pilis ir kiti — visi pasiekiami autobusu. Tokio kultūrinio tankio kitur Japonijoje nėra.' },
        { color: 'g', title: 'Gion rajonas vakare', description: 'Šimtametės medinės namo eilės, tradiciniai restoranai, galimybė pamatyti geišą. Gion yra vienintelis rajonas Japonijoje, kur ši kultūra dar gyva.' },
      ],
      compare: {
        without: [
          'Fushimi Inari vartai dieną — minios turistų',
          'Arašijama bambukai 10:00–14:00 — spūstis',
          'Populiarūs ryokan viešbučiai be rezervacijos',
          'Nishiki turgus pietų metu — negalėsi judėti',
        ],
        with: [
          'Fushimi Inari — eikite 6:00 arba po 18:00, visiškai tuščia',
          'Arašijama — anksti ryte iki 8:00, bambukai be žmonių',
          'Ryokan — rezervuokite 2–3 mėnesius iš anksto',
          'Nishiki — eikite 9:00 atidarymui',
        ],
      },
      tips: '<p>IC kortelė (Suica/ICOCA) — visiems transporto rūšims Japonijoje, įskaitant convenience store pirkimus.</p><p>Kioto autobusų dienos bilietas — ¥600 (€3,80). Visi pagrindiniai objektai pasiekiami.</p><p>Geišos fotografavimas be leidimo Gion rajone — nemandagu ir draudžiama kai kuriose gatvėse. Stebėkite iš pagarbaus atstumo.</p>',
      emergency: { police: '110', ambulance: '119', embassy: '+81 3-3203-9475', code: '+81', note: 'Lietuvos ambasada Tokijuje, konsulinis padengimas Kiote.' },
      featuredAttractionCount: 2,
      totalAttractions: 8,
      totalFoodSpots: 8,
      soldCount: 198,
      plan: {
        destinationId: 'kyoto',
        costs: { flights: 900, hotel: 800, food: 400, transport: 100, activities: 200 },
        days: [
          {
            day: 1,
            title: 'Atvykimas ir Gion rajonas',
            items: [
              { type: 'flight', name: 'Vilnius → Kiotas (per Frankfurtą)', description: 'Lufthansa + ANA · Osaka KIX · 12 val.', price: '€400' },
              { type: 'activity', name: 'Gion rajonas vakare', description: 'Tradicinės gatvės, geišų kultūra, tradiciniai restoranai.', price: 'Nemokama' },
              { type: 'food', name: 'Nishiki turgus', description: 'Japoniškas maistas ant grotelių ir gatvės užkandžiai.', price: '€€' },
            ],
          },
          {
            day: 2,
            title: 'Fushimi Inari ir Arašijama',
            items: [
              { type: 'activity', name: 'Fushimi Inari', description: '10 000 oranžinių vartų kalne — ryte be minių.', price: 'Nemokama' },
              { type: 'activity', name: 'Arašijamos bambukai', description: 'Mistinis bambukinių medžių miškas netoli upės.', price: 'Nemokama' },
              { type: 'activity', name: 'Kinkaku-ji', description: 'Auksinis paviljonas — vienas gražiausių Japonijoje.', price: '€3' },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'marrakech', name: 'Marakesas', country: 'Marokas',
    styles: ['culture', 'food', 'history'], bestSeason: 'Spalis – Lapkritis',
    imgUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&q=85',
    currentWeather: '28°C', lat: 31.6295, lng: -7.9811, radiusKm: 20,
    content: { description: 'Raudonasis miestas — spalvų, kvapų ir garsų simfonija.', highlights: ['Djemaa el-Fna', 'Medina', 'Majorelle sodas', 'Soukų turgus'], flightHours: 5, minDailyBudget: 40, startingPrice: 890 },
  },
  {
    id: 'porto', name: 'Portas', country: 'Portugalija',
    styles: ['culture', 'food', 'city'], bestSeason: 'Gegužė – Rugsėjis',
    imgUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=1920&q=85',
    currentWeather: '17°C', lat: 41.1579, lng: -8.6291, radiusKm: 20,
    content: { description: 'Azulejo plytelių miestas prie Douro upės.', highlights: ['Ribeira', 'Dom Luís tiltas', 'Porto vinai', 'Livraria Lello'], flightHours: 4, minDailyBudget: 45, startingPrice: 920 },
  },
  {
    id: 'dubrovnik', name: 'Dubrovnikas', country: 'Kroatija',
    styles: ['beach', 'history', 'culture'], bestSeason: 'Birželis – Rugpjūtis',
    imgUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920&q=85',
    currentWeather: '24°C', lat: 42.6507, lng: 18.0944, radiusKm: 15,
    content: { description: 'Adrijos jūros perlas — Senasis miestas su galingomis sienomis.', highlights: ['Senojo miesto sienos', 'Stradun gatvė', 'Lokrum sala', 'Žygis kalnais'], flightHours: 2.5, minDailyBudget: 70, startingPrice: 1350 },
  },
  {
    id: 'rome', name: 'Roma', country: 'Italija',
    styles: ['culture', 'history', 'food'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1920&q=85',
    currentWeather: '20°C', lat: 41.9028, lng: 12.4964, radiusKm: 20,
    content: { description: 'Amžinasis miestas — du tūkstančiai metų istorijos kiekvienoje gatvėje.', highlights: ['Koliziejus', 'Vatikanas', 'Trevi fontanas', 'Forumas'], flightHours: 3, minDailyBudget: 65, startingPrice: 1150 },
  },
  {
    id: 'paris', name: 'Paryžius', country: 'Prancūzija',
    styles: ['culture', 'food', 'city', 'history'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=85',
    currentWeather: '15°C', lat: 48.8566, lng: 2.3522, radiusKm: 25,
    content: { description: 'Šviesos miestas — meno, mados ir gastronomijos sostinė.', highlights: ['Eifelio bokštas', 'Luvras', 'Monmarras', 'Notre-Dame'], flightHours: 3, minDailyBudget: 80, startingPrice: 1280 },
  },
  {
    id: 'amsterdam', name: 'Amsterdamas', country: 'Nyderlandai',
    styles: ['culture', 'city', 'history'], bestSeason: 'Balandis – Gegužė',
    imgUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1920&q=85',
    currentWeather: '12°C', lat: 52.3676, lng: 4.9041, radiusKm: 15,
    content: {
      description: 'Kanalų miestas — dviračiai, muziejai ir tulpių laukai.',
      highlights: ['Rijksmuseum', 'Ano Frank namai', 'Kanalai', 'Keukenhof tulpės'],
      flightHours: 2.5, minDailyBudget: 80, startingPrice: 1200,
      cost: { budget: '€80–110', mid: '€140–190', comfort: '€230–350' },
      tags: [{ text: 'Kanalų miestas', color: 'blu' }, { text: 'Dviračių rojus', color: 'grn' }, { text: 'Tulpių sezonas', color: 'grn' }],
      weather: [
        { month: 'Sau', temp: '5°', quality: 'ok' }, { month: 'Vas', temp: '6°', quality: 'ok' },
        { month: 'Kov', temp: '9°', quality: 'ok' }, { month: 'Bal', temp: '12°', quality: 'best' },
        { month: 'Geg', temp: '16°', quality: 'best' }, { month: 'Bir', temp: '19°', quality: 'best' },
        { month: 'Lie', temp: '21°', quality: 'good' }, { month: 'Rgp', temp: '21°', quality: 'good' },
        { month: 'Rgs', temp: '18°', quality: 'good' }, { month: 'Spa', temp: '13°', quality: 'ok' },
        { month: 'Lap', temp: '8°', quality: 'ok' }, { month: 'Grd', temp: '5°', quality: 'ok' },
      ],
      why: [
        { color: 'g', title: 'Dviračių miestas', description: 'Nuomojam dviratį ir rodome maršrutus pro vietinių mėgstamas vietas.' },
        { color: 'b', title: 'Muziejų strategija', description: 'Van Gogh ryte, Rijks popiet — be eilių, optimalus laikas.' },
        { color: 'o', title: 'Tulpių sezonas', description: 'Balandžio pradžia — Keukenhof žydi, tik 30min nuo miesto.' },
      ],
      compare: {
        without: ['Anės Frank be bilieto — nepateksi', 'Van Gogh muziejus popiet — pilna', 'Pietūs Damrak gatvėje — turistinė pasala', 'Dviratis be maršruto — pasiklysti'],
        with: ['Anės Frank bilietai — nupirkti iš anksto', 'Van Gogh 9:00 — ramiai apžiūri', 'Pietūs Albert Cuyp turguje — pigiau ir skaniau', 'Dviratis su mūsų maršrutu — per vietinių rajonus'],
      },
      tips: '<p style="margin-bottom:8px">I amsterdam City Card — neapsimoka. Geriau pirk bilietus atskirai.</p><p style="margin-bottom:8px">Dviratį nuomok MacBike arba Swapfiets (€8/dieną) — miestą apžiūri 3x greičiau.</p><p>OV-chipkaart (€7,50 + papildymas) — visiems transporto rūšims.</p>',
      emergency: { police: '112', ambulance: '112', embassy: '+31 70 385 4900', code: '+31', note: 'Lietuvos ambasada Hagoje.' },
      plan: {
        destinationId: 'amsterdam',
        costs: { flights: 200, hotel: 900, food: 350, transport: 70, activities: 150 },
        days: [
          { label: '1 diena', title: 'Kanalai ir muziejai', activities: ['Rytas: Rijksmuseum (9:00)', 'Popietė: Van Gogh muziejus', 'Vakaras: Kanalų pasivaikščiojimas'] },
          { label: '2 diena', title: 'Istorija ir Jordaan', activities: ['Rytas: Anės Frank namai (bilietai iš anksto)', 'Popietė: Jordaan rajonas', 'Vakaras: Brouwerij \'t IJ alaus darykla'] },
          { label: '3 diena', title: 'Turgus ir Vondelpark', activities: ['Rytas: Albert Cuyp turgus', 'Popietė: Vondelpark', 'Vakaras: Foodhallen street food'] },
        ],
      },
      featuredAttractionCount: 2,
      totalAttractions: 10,
      totalFoodSpots: 10,
      soldCount: 234,
    },
  },
  {
    id: 'prague', name: 'Praga', country: 'Čekija',
    styles: ['culture', 'history', 'city'], bestSeason: 'Gegužė – Rugsėjis',
    imgUrl: 'https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85',
    currentWeather: '13°C', lat: 50.0755, lng: 14.4378, radiusKm: 20,
    content: { description: 'Šimtų bokštų miestas — viduramžių architektūros šedevras.', highlights: ['Senamiesčio aikštė', 'Prahos pilis', 'Karlov tiltas', 'Josefov kvartalas'], flightHours: 2, minDailyBudget: 45, startingPrice: 850 },
  },
  {
    id: 'athens', name: 'Atėnai', country: 'Graikija',
    styles: ['culture', 'history', 'food'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920&q=85',
    currentWeather: '22°C', lat: 37.9838, lng: 23.7275, radiusKm: 20,
    content: { description: 'Demokratijos lopšys — du su puse tūkstančio metų istorija.', highlights: ['Akropolis', 'Partenonas', 'Plaka kvartalas', 'Nacionalinis muziejus'], flightHours: 3.5, minDailyBudget: 55, startingPrice: 1050 },
  },
  {
    id: 'budapest', name: 'Budapeštas', country: 'Vengrija',
    styles: ['culture', 'history', 'city'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85',
    currentWeather: '14°C', lat: 47.4979, lng: 19.0402, radiusKm: 20,
    content: { description: 'Dunojaus perlai — Budas ir Peštas, sujungti tilto.', highlights: ['Parlamento rūmai', 'Termaliniai vonios', 'Žvejų bastionas', 'Ruin bariai'], flightHours: 2, minDailyBudget: 45, startingPrice: 880 },
  },
  {
    id: 'tenerife', name: 'Tenerifė', country: 'Ispanija',
    styles: ['beach', 'nature', 'city'], bestSeason: 'Lapkritis – Kovas',
    imgUrl: 'https://images.unsplash.com/photo-1512253037373-90bdc4c43a8b?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1512253037373-90bdc4c43a8b?w=1920&q=85',
    currentWeather: '25°C', lat: 28.2916, lng: -16.6291, radiusKm: 40,
    content: { description: 'Amžinojo pavasario sala — Teide ugnikalnio šešėlyje.', highlights: ['Teide nacionalinis parkas', 'Los Gigantes uolos', 'Anaga miškas', 'Santa Cruz karnavalai'], flightHours: 5, minDailyBudget: 60, startingPrice: 1100 },
  },
  {
    id: 'santorini', name: 'Santorinis', country: 'Graikija',
    styles: ['beach', 'culture', 'romantic'], bestSeason: 'Gegužė – Rugsėjis',
    imgUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=85',
    currentWeather: '23°C', lat: 36.3932, lng: 25.4615, radiusKm: 15,
    content: { description: 'Baltų kupolų ir mėlyno dangaus ikona — Egėjo jūroje.', highlights: ['Oia saulėlydis', 'Fira miestelis', 'Raudonasis paplūdimys', 'Vulkano ekskursija'], flightHours: 4, minDailyBudget: 90, startingPrice: 1650 },
  },
  {
    id: 'vienna', name: 'Viena', country: 'Austrija',
    styles: ['culture', 'history', 'city'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1920&q=85',
    currentWeather: '14°C', lat: 48.2082, lng: 16.3738, radiusKm: 20,
    content: { description: 'Imperijos sostinė — muzikos, meno ir kavos kultūros centras.', highlights: ['Schönbrunno rūmai', 'Stephansdom', 'Kunsthistorisches muziejus', 'Prateris'], flightHours: 2.5, minDailyBudget: 65, startingPrice: 1100 },
  },
  {
    id: 'berlin', name: 'Berlynas', country: 'Vokietija',
    styles: ['culture', 'history', 'city'], bestSeason: 'Birželis – Rugpjūtis',
    imgUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1920&q=85',
    currentWeather: '11°C', lat: 52.5200, lng: 13.4050, radiusKm: 25,
    content: { description: 'Kūrybos ir istorijos miestas — sienų griūtis ir naujoji Europa.', highlights: ['Berlyno sienos memorialas', 'Brandenburgo vartai', 'Muziejų sala', 'Kreuzberg kvartalas'], flightHours: 2, minDailyBudget: 55, startingPrice: 980 },
  },
  {
    id: 'bali', name: 'Balis', country: 'Indonezija',
    styles: ['beach', 'nature', 'culture'], bestSeason: 'Balandis – Spalis',
    imgUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&q=85',
    currentWeather: '29°C', lat: -8.3405, lng: 115.0920, radiusKm: 50,
    content: { description: 'Dievų sala — ryžių terasos, šventyklos ir vandenynas.', highlights: ['Ubudo ryžių terasos', 'Tanah Lot šventykla', 'Seminyak paplūdimys', 'Monkey Forest'], flightHours: 13, minDailyBudget: 35, startingPrice: 1800 },
  },
  {
    id: 'tbilisi', name: 'Tbilisis', country: 'Gruzija',
    styles: ['culture', 'history', 'food'], bestSeason: 'Balandis – Birželis',
    imgUrl: 'https://images.unsplash.com/photo-1567591370978-f3286bfc00a1?w=1200&q=85',
    heroImageUrl: 'https://images.unsplash.com/photo-1567591370978-f3286bfc00a1?w=1920&q=85',
    currentWeather: '17°C', lat: 41.6938, lng: 44.8015, radiusKm: 20,
    content: { description: 'Senovinis Kaukazo miestas — vynas, khinkali ir sieros vonios.', highlights: ['Narikala tvirtovė', 'Sioni katedra', 'Abanotubani sieros vonios', 'Rustaveli prospektas'], flightHours: 4, minDailyBudget: 30, startingPrice: 750 },
  },
];

// ─── Attractions ──────────────────────────────────────────────────────────────

const attractions: {
  id: string; name: string; lat: number; lng: number;
  category: AttractionCategory; description: string; img: string;
  priceAndDuration?: string; openingHours?: string; bestTime?: string;
  content: Record<string, unknown>;
}[] = [
  // Barcelona
  { id: 'sagrada-familia', name: 'Sagrada Família', lat: 41.4036, lng: 2.1744, category: 'popular', description: 'Gaudí\'s unfinished basilica — the most visited monument in Spain.', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', priceAndDuration: '€26 · 1–2h', openingHours: '9:00–20:00', bestTime: 'Morning', content: { hook: 'Over 140 years in the making and still not finished.', tip: 'Book tickets at least 2 weeks ahead.', photos: [] } },
  { id: 'park-guell', name: 'Park Güell', lat: 41.4145, lng: 2.1527, category: 'popular', description: 'UNESCO-listed park with mosaic terraces and city panoramas.', img: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', priceAndDuration: '€10 · 1–2h', openingHours: '9:30–19:30', bestTime: 'Late afternoon', content: { hook: 'The dragon staircase is one of the most photographed spots in Barcelona.', tip: 'The free zones around the monumental area are worth exploring too.' } },
  { id: 'la-boqueria', name: 'La Boqueria', lat: 41.3817, lng: 2.1718, category: 'popular', description: 'Barcelona\'s iconic covered market on La Rambla.', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', priceAndDuration: 'Free · 1h', openingHours: '8:00–20:30', bestTime: 'Weekday morning', content: { hook: 'Over 200 stalls selling fresh produce, seafood, and tapas.', tip: 'Avoid weekends — head to Mercat de Santa Caterina instead.' } },
  { id: 'gothic-quarter-bcn', name: 'Gothic Quarter', lat: 41.3825, lng: 2.1769, category: 'gem', description: 'Medieval labyrinth of narrow streets in the heart of Barcelona.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', priceAndDuration: 'Free · 2–3h', openingHours: 'Always open', bestTime: 'Evening', content: { hook: 'Some streets date back to Roman times.', tip: 'Get lost on purpose — the best finds are off the main paths.' } },
  { id: 'casa-batllo', name: 'Casa Batlló', lat: 41.3916, lng: 2.1650, category: 'popular', description: 'Gaudí\'s spectacular modernista masterpiece on Passeig de Gràcia.', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', priceAndDuration: '€35 · 1–2h', openingHours: '9:00–21:00', bestTime: 'Magic Night event', content: { hook: 'The facade is inspired by the legend of Saint George and the dragon.', tip: 'The rooftop terrace at night is magical.' } },
  { id: 'barceloneta-beach', name: 'Barceloneta Beach', lat: 41.3793, lng: 2.1907, category: 'popular', description: 'Barcelona\'s most famous urban beach, 1.9 km of golden sand.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', priceAndDuration: 'Free', openingHours: 'Always open', bestTime: 'Early morning or late afternoon', content: { hook: 'Remarkably clean for a city beach.', tip: 'Avoid peak hours (12:00–17:00) in July and August.' } },
  { id: 'palau-musica', name: 'Palau de la Música Catalana', lat: 41.3875, lng: 2.1754, category: 'gem', description: 'Stunning Art Nouveau concert hall — a UNESCO World Heritage Site.', img: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800', priceAndDuration: '€22 guided tour · 1h', openingHours: 'Tours 10:00–15:30', bestTime: 'Morning', content: { hook: 'Built by Domènech i Montaner as a gift to Barcelona\'s choral society.', tip: 'Attend a concert for the full experience — tickets from €15.' } },
  { id: 'montjuic-castle', name: 'Montjuïc Castle', lat: 41.3638, lng: 2.1661, category: 'gem', description: '18th-century military fortress with panoramic views of Barcelona and the sea.', img: 'https://images.unsplash.com/photo-1512253037373-90bdc4c43a8b?w=800', priceAndDuration: '€5 · 1–2h', openingHours: '10:00–18:00', bestTime: 'Sunset', content: { hook: 'Used as a political prison until 1960.', tip: 'Take the cable car from Barceloneta for spectacular views.' } },
  { id: 'picasso-museum-bcn', name: 'Picasso Museum', lat: 41.3851, lng: 2.1808, category: 'popular', description: 'One of the most important collections of Picasso\'s early works.', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', priceAndDuration: '€14 · 1–2h', openingHours: '10:00–19:00', bestTime: 'Weekday', content: { hook: 'Housed in five adjacent medieval palaces.', tip: 'Free on the first Sunday of the month.' } },
  { id: 'camp-nou', name: 'Camp Nou', lat: 41.3809, lng: 2.1228, category: 'popular', description: 'FC Barcelona\'s legendary stadium — largest in Europe at 99,354 seats.', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', priceAndDuration: '€26 museum · 2h', openingHours: '10:00–18:30', bestTime: 'Match day', content: { hook: 'Barça is more than a club — it\'s a symbol of Catalan identity.', tip: 'Attend a La Liga match for the real atmosphere.' } },

  // Lisbon
  { id: 'alfama', name: 'Alfama District', lat: 38.7108, lng: -9.1394, category: 'popular', description: 'Lisbon\'s oldest neighbourhood — Moorish streets, fado, and viewpoints.', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800', priceAndDuration: 'Free · 2–3h', openingHours: 'Always open', bestTime: 'Late afternoon', content: { hook: 'The only neighbourhood that survived the 1755 earthquake intact.', tip: 'Follow the sound of fado on Thursday evenings.' } },
  { id: 'belem-tower', name: 'Belém Tower', lat: 38.6916, lng: -9.2160, category: 'popular', description: 'Iconic 16th-century fortress on the Tagus river, UNESCO listed.', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', priceAndDuration: '€8 · 1h', openingHours: '10:00–17:30', bestTime: 'Morning', content: { hook: 'Built to defend Lisbon\'s harbour during the Age of Discovery.', tip: 'Combine with Jerónimos Monastery — they are 10 min apart on foot.' } },
  { id: 'jeronimos-monastery', name: 'Jerónimos Monastery', lat: 38.6978, lng: -9.2065, category: 'popular', description: 'Manueline masterpiece — Vasco da Gama is buried here.', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', priceAndDuration: '€15 · 1–2h', openingHours: '10:00–17:30', bestTime: 'Weekday morning', content: { hook: 'Built to celebrate Vasco da Gama\'s return from India in 1499.', tip: 'The south portal is one of the finest examples of Manueline art.' } },
  { id: 'lx-factory', name: 'LX Factory', lat: 38.7019, lng: -9.1772, category: 'gem', description: 'Creative hub in a 19th-century industrial complex — shops, restaurants, events.', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', priceAndDuration: 'Free · 2h', openingHours: '12:00–00:00 (Sun market 10:00–18:00)', bestTime: 'Sunday market', content: { hook: 'The Sunday market draws Lisbon\'s best food and artisan vendors.', tip: 'Book dinner at one of the restaurants in advance on weekends.' } },
  { id: 'sao-jorge-castle', name: 'São Jorge Castle', lat: 38.7139, lng: -9.1334, category: 'popular', description: 'Moorish hilltop castle with sweeping views over Lisbon\'s rooftops.', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800', priceAndDuration: '€15 · 1–2h', openingHours: '9:00–21:00', bestTime: 'Sunset', content: { hook: 'Occupied continuously since 48 BC — Phoenicians, Romans, Moors, and Portuguese.', tip: 'The views from the ramparts at sunset are breathtaking.' } },
  { id: 'azulejo-museum', name: 'Museu Nacional do Azulejo', lat: 38.7249, lng: -9.1185, category: 'gem', description: 'Dedicated entirely to the traditional Portuguese decorative tile.', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800', priceAndDuration: '€5 · 1–2h', openingHours: '10:00–18:00', bestTime: 'Weekday', content: { hook: 'The 18th-century panorama of Lisbon before the 1755 earthquake is unmissable.', tip: 'One of the most underrated museums in Europe.' } },
  { id: 'praca-comercio', name: 'Praça do Comércio', lat: 38.7075, lng: -9.1364, category: 'popular', description: 'Lisbon\'s grand waterfront square — the historic gateway to the city.', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', priceAndDuration: 'Free', openingHours: 'Always open', bestTime: 'Evening', content: { hook: 'Once the site of the Royal Palace before the earthquake destroyed it.', tip: 'Take the ferry across the Tagus for a spectacular view of the square.' } },
  { id: 'time-out-market', name: 'Time Out Market Lisboa', lat: 38.7071, lng: -9.1477, category: 'popular', description: 'Curated food hall featuring the best of Lisbon\'s chefs under one roof.', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800', priceAndDuration: 'Free entry · €10–20 per meal', openingHours: '10:00–00:00', bestTime: 'Lunch', content: { hook: 'The original — over 40 restaurants and 8 bars in the historic Mercado da Ribeira.', tip: 'The pastel de nata from Manteigaria here is the best in the city.' } },
  { id: 'miradouro-graca', name: 'Miradouro da Graça', lat: 38.7183, lng: -9.1299, category: 'gem', description: 'Lisbon\'s best-kept viewpoint secret — stunning castle and river views.', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', priceAndDuration: 'Free', openingHours: 'Always open', bestTime: 'Sunset', content: { hook: 'Less touristy than Portas do Sol and Santa Luzia — locals come here.', tip: 'Get there early for sunset — it fills up fast on warm evenings.' } },
  { id: 'oceanarium-lisbon', name: 'Lisbon Oceanarium', lat: 38.7630, lng: -9.0940, category: 'popular', description: 'One of Europe\'s best aquariums — a central tank you can view from two floors.', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800', priceAndDuration: '€23 · 2h', openingHours: '10:00–20:00', bestTime: 'Weekday', content: { hook: 'The sunfish (mola mola) exhibit is one of only a handful in the world.', tip: 'Great for rainy days — buy tickets online to skip the queue.' } },

  // Rome
  { id: 'colosseum', name: 'Colosseum', lat: 41.8902, lng: 12.4922, category: 'popular', description: 'The iconic amphitheatre of ancient Rome — once held 80,000 spectators.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: '€18 · 2–3h', openingHours: '9:00–19:00', bestTime: 'First entry slot', content: { hook: 'Gladiatorial combat here lasted until 404 AD.', tip: 'The €18 ticket includes the Roman Forum and Palatine Hill — use all three.' } },
  { id: 'vatican-museums', name: 'Vatican Museums', lat: 41.9065, lng: 12.4536, category: 'popular', description: 'World\'s largest museum complex — home to the Sistine Chapel.', img: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800', priceAndDuration: '€20 · 3–4h', openingHours: '9:00–18:00', bestTime: 'Early morning', content: { hook: 'Michelangelo painted the Sistine Chapel ceiling lying on his back over 4 years.', tip: 'Book well in advance — queues without a ticket can be 3–4 hours.' } },
  { id: 'trevi-fountain', name: 'Trevi Fountain', lat: 41.9009, lng: 12.4833, category: 'popular', description: 'Rome\'s grandest baroque fountain — throw a coin to guarantee your return.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: 'Free', openingHours: 'Always open', bestTime: 'Before 7am or after 11pm', content: { hook: 'Roughly €3,000 is thrown in each day, donated to charity.', tip: 'Come at dawn or late night to avoid the crush.' } },
  { id: 'roman-forum', name: 'Roman Forum', lat: 41.8925, lng: 12.4853, category: 'popular', description: 'The political and social heart of ancient Rome for over 900 years.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: 'Included with Colosseum · 1–2h', openingHours: '9:00–19:00', bestTime: 'Afternoon', content: { hook: 'Julius Caesar was cremated here.', tip: 'Wear comfortable shoes — the ancient cobblestones are uneven.' } },
  { id: 'pantheon-rome', name: 'Pantheon', lat: 41.8986, lng: 12.4769, category: 'popular', description: 'The best-preserved ancient building in the world — 2000 years old.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: '€5 · 30–60min', openingHours: '9:00–19:00', bestTime: 'Rainy day (oculus effect)', content: { hook: 'The unreinforced concrete dome is still the world\'s largest.', tip: 'On rainy days the rain falls through the oculus and drains through the floor — worth experiencing.' } },
  { id: 'piazza-navona', name: 'Piazza Navona', lat: 41.8992, lng: 12.4730, category: 'popular', description: 'Rome\'s most elegant baroque piazza — three fountains, street artists, cafes.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: 'Free', openingHours: 'Always open', bestTime: 'Evening', content: { hook: 'Built on the site of a 1st-century stadium that held 30,000 spectators.', tip: 'Avoid the tourist cafes on the square — the food nearby is half the price.' } },
  { id: 'borghese-gallery', name: 'Borghese Gallery', lat: 41.9139, lng: 12.4922, category: 'gem', description: 'Intimate gallery with some of Bernini\'s finest sculptures and Caravaggio paintings.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: '€20 · 2h (strictly timed)', openingHours: '9:00–19:00 (2h slots)', bestTime: 'First slot (9:00)', content: { hook: 'Only 360 visitors allowed at a time — the most exclusive museum in Rome.', tip: 'Book 2–3 months in advance. This is non-negotiable.' } },
  { id: 'trastevere', name: 'Trastevere', lat: 41.8886, lng: 12.4695, category: 'gem', description: 'Rome\'s bohemian neighbourhood — medieval streets, ivy-covered buildings, trattorias.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: 'Free · 2–3h', openingHours: 'Always open', bestTime: 'Evening', content: { hook: 'Home to some of Rome\'s oldest churches, including the 4th-century Santa Maria.', tip: 'Come for aperitivo at 18:00 and stay for dinner — the best trattorias are here.' } },
  { id: 'spanish-steps-rome', name: 'Spanish Steps', lat: 41.9058, lng: 12.4823, category: 'popular', description: 'Baroque staircase of 135 steps — a classic Rome meeting point.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: 'Free', openingHours: 'Always open', bestTime: 'Spring (azaleas bloom)', content: { hook: 'Named after the Spanish Embassy nearby, despite being entirely funded by the French.', tip: 'In spring the steps are covered in azaleas — stunning for photos.' } },
  { id: 'castel-santangelo', name: 'Castel Sant\'Angelo', lat: 41.9031, lng: 12.4663, category: 'gem', description: 'Former mausoleum, fortress, and papal prison — now a museum with rooftop views.', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', priceAndDuration: '€15 · 1–2h', openingHours: '9:00–19:30', bestTime: 'Sunset from rooftop', content: { hook: 'The Passetto di Borgo is a secret corridor popes used to escape to safety.', tip: 'The rooftop bar is open in summer — best sunset view in Rome.' } },

  // Paris
  { id: 'eiffel-tower', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, category: 'popular', description: 'The world\'s most visited paid monument — 330m of iron lattice.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: '€29 top floor · 2h', openingHours: '9:00–23:45', bestTime: 'Dusk', content: { hook: 'Built in just 2 years, 2 months, and 5 days for the 1889 World\'s Fair.', tip: 'Book the summit ticket online weeks in advance. Stairs tickets are easier to get.' } },
  { id: 'louvre-museum', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, category: 'popular', description: 'World\'s largest art museum — 380,000 objects, 35,000 on display.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: '€22 · 3–6h', openingHours: '9:00–18:00', bestTime: 'Wednesday/Friday evening (open until 21:45)', content: { hook: 'It would take 200 days to see everything in the Louvre, spending 30 seconds per piece.', tip: 'Focus on 2–3 wings max. The Mona Lisa room is always packed — see it first.' } },
  { id: 'notre-dame', name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499, category: 'popular', description: 'Gothic masterpiece on the Île de la Cité — reopened in 2024 after restoration.', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', priceAndDuration: 'Free · 1h', openingHours: '8:00–19:00', bestTime: 'Weekday morning', content: { hook: 'Construction began in 1163 and took nearly 200 years.', tip: 'Climb the towers for the best gargoyle photos in Paris.' } },
  { id: 'sacre-coeur', name: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431, category: 'popular', description: 'White Romano-Byzantine basilica at the top of Montmartre hill.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: 'Free', openingHours: '6:00–22:30', bestTime: 'Sunrise', content: { hook: 'The dome offers a 360° view stretching 50 km on a clear day.', tip: 'Watch the sunrise from the steps — Paris is empty and magical at 6am.' } },
  { id: 'musee-dorsay', name: 'Musée d\'Orsay', lat: 48.8600, lng: 2.3266, category: 'popular', description: 'World\'s finest Impressionist collection — Monet, Renoir, Van Gogh, Degas.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: '€16 · 2–3h', openingHours: '9:30–18:00', bestTime: 'Thursday evening', content: { hook: 'Housed in a Beaux-Arts railway station built for the 1900 World\'s Fair.', tip: 'Thursday open until 21:45 — the evening crowd is much smaller.' } },
  { id: 'versailles', name: 'Palace of Versailles', lat: 48.8049, lng: 2.1204, category: 'popular', description: 'The Sun King\'s palace — 2,300 rooms, 800 hectares of gardens.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: '€20 · 4–6h', openingHours: '9:00–17:30', bestTime: 'Tuesdays (closed Mondays)', content: { hook: 'Louis XIV moved the court here in 1682 — 20,000 people lived on the grounds.', tip: 'Buy the Palace + Gardens ticket. The gardens alone are worth 2 hours.' } },
  { id: 'centre-pompidou', name: 'Centre Pompidou', lat: 48.8607, lng: 2.3523, category: 'gem', description: 'Inside-out high-tech building — Europe\'s largest modern art museum.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: '€15 · 2–3h', openingHours: '11:00–21:00', bestTime: 'Evening', content: { hook: 'The architects hid nothing — pipes, ducts, and escalators are all outside the building.', tip: 'The rooftop terrace has one of the best free views in Paris.' } },
  { id: 'arc-de-triomphe', name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950, category: 'popular', description: 'Napoleon\'s triumphal arch at the centre of 12 radiating avenues.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: '€13 rooftop · 1h', openingHours: '10:00–23:00', bestTime: 'Night', content: { hook: 'The Tomb of the Unknown Soldier has burned continuously since 1923.', tip: 'Use the underground tunnel to cross — never cross the roundabout on foot.' } },
  { id: 'le-marais', name: 'Le Marais', lat: 48.8560, lng: 2.3617, category: 'gem', description: 'Paris\'s hippest neighbourhood — medieval mansions, galleries, falafel, vintage shops.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: 'Free · 3h', openingHours: 'Always open', bestTime: 'Saturday afternoon', content: { hook: 'Home to Paris\'s Jewish quarter, oldest square (Place des Vosges), and best falafel.', tip: 'L\'As du Fallafel on Rue des Rosiers is a Marais institution — queue early.' } },
  { id: 'palais-royal', name: 'Palais-Royal Gardens', lat: 48.8638, lng: 2.3369, category: 'gem', description: 'Secret garden with arcaded galleries, cafes, and the black-and-white column art.', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', priceAndDuration: 'Free', openingHours: '8:00–23:00', bestTime: 'Morning', content: { hook: 'One of the best-kept secrets in central Paris — most tourists walk right past it.', tip: 'The Buren columns in the courtyard are Instagram gold with zero crowds.' } },

  // Kyoto
  { id: 'fushimi-inari', name: 'Fushimi Inari-taisha', lat: 34.9671, lng: 135.7727, category: 'popular', description: 'Thousands of vermillion torii gates winding up Mount Inari.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: 'Free · 2–4h', openingHours: 'Always open', bestTime: 'Before 7am or after 6pm', content: { hook: 'There are over 10,000 torii gates — donated by businesses for good fortune.', tip: 'Most tourists stop at the first two gates. Hike all the way up for solitude.' } },
  { id: 'arashiyama-bamboo', name: 'Arashiyama Bamboo Grove', lat: 35.0170, lng: 135.6720, category: 'popular', description: 'Iconic bamboo forest with towering stalks that creak in the wind.', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800', priceAndDuration: 'Free · 30min', openingHours: 'Always open', bestTime: 'Before 8am', content: { hook: 'The grove is surprisingly small — combine with Tenryu-ji garden next door.', tip: 'Go at dawn when mist rises from the bamboo. Completely different experience.' } },
  { id: 'kinkakuji', name: 'Kinkaku-ji (Golden Pavilion)', lat: 35.0394, lng: 135.7292, category: 'popular', description: 'Zen Buddhist temple covered in gold leaf — reflected in a mirror pond.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: '¥500 · 1h', openingHours: '9:00–17:00', bestTime: 'Winter snowfall or spring', content: { hook: 'Burned down by a monk in 1950 and rebuilt identically in 1955.', tip: 'The garden circuit takes 20 minutes — short but perfectly formed.' } },
  { id: 'gion-district', name: 'Gion District', lat: 35.0036, lng: 135.7750, category: 'popular', description: 'Kyoto\'s famous geisha district — preserved machiya townhouses and ochaya teahouses.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: 'Free · 2h', openingHours: 'Always open', bestTime: '17:00–20:00', content: { hook: 'Geiko (geisha) and maiko (apprentices) still work here — maybe 200 remaining in Kyoto.', tip: 'Don\'t photograph or touch geiko/maiko — it is considered deeply disrespectful.' } },
  { id: 'nishiki-market', name: 'Nishiki Market', lat: 35.0052, lng: 135.7657, category: 'gem', description: 'Kyoto\'s "Kitchen" — a covered 400-metre arcade of food stalls.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: 'Free · 1–2h', openingHours: '9:00–18:00', bestTime: 'Late morning', content: { hook: 'Over 100 shops selling pickles, tofu, fresh dashi, and Kyoto sweets.', tip: 'Try yudofu (tofu hot pot) from one of the standing bars — a Kyoto speciality.' } },
  { id: 'kiyomizudera', name: 'Kiyomizu-dera', lat: 34.9948, lng: 135.7850, category: 'popular', description: 'Buddhist temple built on a wooden stage jutting from a hillside — no nails used.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: '¥500 · 1–2h', openingHours: '6:00–18:00', bestTime: 'Autumn (maple leaves) or spring (cherry blossoms)', content: { hook: '"To jump off the stage at Kiyomizu" is a Japanese idiom for taking a bold decision.', tip: 'The night illuminations in spring and autumn are extraordinary — check the schedule.' } },
  { id: 'nijo-castle', name: 'Nijo Castle', lat: 35.0142, lng: 135.7481, category: 'gem', description: 'Tokugawa shogun\'s Kyoto residence — famous for its "nightingale floors" that squeak.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: '¥1,300 · 1–2h', openingHours: '8:45–17:00', bestTime: 'Weekday', content: { hook: 'The floors were designed to squeak to alert guards of intruders — ingenious security.', tip: 'The Ninomaru Palace has stunning gilded screen paintings from the Kano school.' } },
  { id: 'ryoanji', name: 'Ryoan-ji Rock Garden', lat: 35.0345, lng: 135.7183, category: 'gem', description: 'The world\'s most famous Zen rock garden — 15 stones, none visible all at once.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: '¥600 · 1h', openingHours: '8:00–17:00', bestTime: 'Weekday morning', content: { hook: 'No one knows who made it or what it means. That ambiguity is the point.', tip: 'Sit and observe for at least 15 minutes — it changes as your mind quiets.' } },
  { id: 'philosophers-path', name: 'Philosopher\'s Path', lat: 35.0271, lng: 135.7924, category: 'gem', description: '2-km stone path along a canal — lined with hundreds of cherry trees.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: 'Free · 1h walk', openingHours: 'Always open', bestTime: 'Late March to early April (cherry blossom)', content: { hook: 'Named after philosopher Nishida Kitaro who walked it daily in meditation.', tip: 'The coffee shops and galleries along the path are perfect for a slow morning.' } },
  { id: 'heian-jingu', name: 'Heian Jingu Shrine', lat: 35.0162, lng: 135.7826, category: 'popular', description: 'Vermillion Shinto shrine with Japan\'s finest stroll garden.', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', priceAndDuration: 'Shrine free, garden ¥600 · 1–2h', openingHours: '6:00–18:00 (garden 8:30–17:30)', bestTime: 'Late April (weeping cherry in garden)', content: { hook: 'Built in 1895 to commemorate the 1,100th anniversary of Kyoto as capital.', tip: 'The garden iris bloom in June is one of Kyoto\'s most spectacular seasonal sights.' } },

  // Berlin
  { id: 'brandenburg-gate', name: 'Brandenburgo vartai', lat: 52.5163, lng: 13.3777, category: 'popular', description: 'Berlino simbolis — 18 a. neoklasikinis vartai, stovintys ant buvusios sienos.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokama · 30min', openingHours: 'Visada atidaryti', bestTime: 'Saulėtekis arba naktis', content: { hook: 'Per Šaltąjį karą vartai buvo uždaryti 28 metus — juos atidarė 1989 m. sienos griūtis.', tip: 'Ateikite anksti rytą arba vėlai vakare — dienos metu minios turistų.' } },
  { id: 'reichstag', name: 'Reichstagas', lat: 52.5186, lng: 13.3762, category: 'popular', description: 'Vokietijos parlamento pastatas su stikline kupola ir panoraminiais miesto vaizdais.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokama (registracija būtina) · 1–2h', openingHours: '8:00–24:00', bestTime: 'Saulėlydis', content: { hook: 'Normanno Fosterio stiklinė kupola simbolizuoja skaidrumą demokratijoje.', tip: 'Registruokitės internetu iš anksto — be rezervacijos neįleidžia.' } },
  { id: 'east-side-gallery', name: 'Rytų šoninė galerija', lat: 52.5052, lng: 13.4392, category: 'popular', description: '1,3 km ilgio buvusios Berlyno sienos atviro oro meno galerija — 105 paveikslai.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokama · 1h', openingHours: 'Visada atidaryti', bestTime: 'Rytas', content: { hook: 'Ilgiausias išlikęs Berlyno sienos fragmentas.', tip: 'Ieškokite ikoninio „Broliško bučinio" paveikslo — jis yra viduryje galerijos.' } },
  { id: 'museum-island', name: 'Muziejų sala', lat: 52.5167, lng: 13.4017, category: 'gem', description: 'UNESCO pasaulio paveldo vieta — penkių pasaulinio lygio muziejų kompleksas Spree upėje.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: '€19 dienos bilietas visiems · 4–6h', openingHours: '10:00–20:00', bestTime: 'Ketvirtadienis (ilgesnis darbo laikas)', content: { hook: 'Pergamo muziejuje yra vienas didžiausių senovės altorių pasaulyje.', tip: 'Pergamo muziejus rekonstruojamas iki 2037 m. — patikrinkite, kurie eksponatai rodomi.' } },
  { id: 'checkpoint-charlie', name: 'Čekpointo Čarlio', lat: 52.5075, lng: 13.3904, category: 'popular', description: 'Garsiausias buvęs Rytų-Vakarų perėjimo punktas Šaltojo karo metu.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokamas žiūrėjimas / €15 muziejus · 1h', openingHours: 'Muziejus 9:00–22:00', bestTime: 'Ankstyvas rytas (mažiau turistų)', content: { hook: '1961 m. čia akis į akį susistojo amerikiečių ir sovietų tankai.', tip: 'Originalus postas buvo nugriautas 1990 m. — dabartinis yra rekonstrukcija.' } },
  { id: 'holocaust-memorial', name: 'Holokausto memorialas', lat: 52.5138, lng: 13.3788, category: 'gem', description: '2711 betono stulpų labirintas, skirtas atminti nužudytus Europos žydus.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokamas · 30–60min', openingHours: 'Memorialas visada / informacinis centras 10:00–20:00', bestTime: 'Bet kuriuo metu', content: { hook: 'Architektas Peteris Eisenmanas sąmoningai nepaaiškino memorialo simbolikos.', tip: 'Nusileidę į informacinį centrą apačioje gausite kontekstą ir individualias istorijas.' } },
  { id: 'berlin-wall-memorial', name: 'Berlyno sienos memorialas', lat: 52.5352, lng: 13.3906, category: 'gem', description: 'Autentiška sienos sekcija su apsaugos juosta — geriausiai išsilaikiusi vieta.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokamas · 1–2h', openingHours: 'Visada atidaryti / dokumentacijos centras 10:00–18:00', bestTime: 'Rytas', content: { hook: 'Vienintelė vieta, kur galite pamatyti visą sienos architektūrą — du pastatus ir apsaugos juostą.', tip: 'Perimtro kortelė viršuje suteikia unikalų vaizdą į buvusią mirties juostą.' } },
  { id: 'tiergarten', name: 'Tīrgartenas', lat: 52.5145, lng: 13.3501, category: 'popular', description: 'Berlyno centrinis parkas — 210 ha miško ir takų miesto širdyje.', img: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800', priceAndDuration: 'Nemokamas · 1–3h', openingHours: 'Visada atidaryti', bestTime: 'Savaitgalio rytas', content: { hook: 'Anksčiau buvęs karališkųjų medžioklių miškas — tapęs parku 1830 m.', tip: 'Nuomokite dviratį ir apvažiuokite visą parką — taip sutaupysite laiko.' } },

  // Amsterdam
  { id: 'rijksmuseum', name: 'Rijksmuseum', lat: 52.3600, lng: 4.8852, category: 'popular', description: 'Netherlands\' national museum — Rembrandt, Vermeer, and Dutch Golden Age masterpieces.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: '€22.50 · 2–4h', openingHours: '9:00–17:00', bestTime: 'Weekday morning', content: { hook: 'The Night Watch is 3.6m × 4.4m — far larger than most visitors expect.', tip: 'Book online — the queue without a ticket can be 2 hours. Come at 9am sharp.' } },
  { id: 'anne-frank-house', name: 'Anne Frank House', lat: 52.3752, lng: 4.8840, category: 'popular', description: 'The hidden annex where Anne Frank hid for two years before her arrest in 1944.', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', priceAndDuration: '€16 · 1.5h', openingHours: '9:00–22:00', bestTime: 'Evening (less crowded)', content: { hook: 'The bookcase that hid the entrance to the annex is still in place.', tip: 'Tickets sell out weeks ahead — only available online at 9am Amsterdam time.' } },
  { id: 'vondelpark', name: 'Vondelpark', lat: 52.3580, lng: 4.8686, category: 'popular', description: 'Amsterdam\'s beloved city park — cyclists, open-air theatre, and rose gardens.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: 'Free · 1–3h', openingHours: 'Always open', bestTime: 'Weekend afternoon', content: { hook: 'The open-air theatre runs free performances every summer — locals pack the grass.', tip: 'Rent a bike here — it\'s the most Dutch experience you can have for €10.' } },
  { id: 'van-gogh-museum', name: 'Van Gogh Museum', lat: 52.3584, lng: 4.8811, category: 'popular', description: 'World\'s largest collection of Van Gogh paintings — over 200 works.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: '€22 · 2–3h', openingHours: '9:00–17:00', bestTime: 'Weekday', content: { hook: 'Van Gogh sold only one painting in his lifetime; today his works fetch hundreds of millions.', tip: 'Buy timed entry tickets months in advance — the museum sells out daily in summer.' } },
  { id: 'canal-ring', name: 'Amsterdam Canal Ring', lat: 52.3676, lng: 4.9041, category: 'popular', description: 'UNESCO-listed 17th-century canal system — 165 canals, 1,500 bridges.', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', priceAndDuration: 'Free to walk · canal cruise €15', openingHours: 'Always open', bestTime: 'Golden hour', content: { hook: 'The canal houses tilt forward intentionally — to hoist goods up without hitting the facade.', tip: 'Rent a kayak for 2 hours — paddling the canals beats any bus tour.' } },
  { id: 'jordaan', name: 'Jordaan District', lat: 52.3738, lng: 4.8797, category: 'gem', description: 'Amsterdam\'s most charming neighbourhood — indie galleries, brown cafes, flower stalls.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: 'Free · 2–3h', openingHours: 'Always open', bestTime: 'Saturday (market day)', content: { hook: 'Built in the 17th century to house workers and artisans — now one of the priciest areas.', tip: 'The Noordermarkt on Saturday morning is the best farmers\' market in Amsterdam.' } },
  { id: 'stedelijk-museum', name: 'Stedelijk Museum', lat: 52.3580, lng: 4.8799, category: 'gem', description: 'Amsterdam\'s museum of modern and contemporary art — Mondrian to Warhol.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: '€22.50 · 2h', openingHours: '10:00–18:00', bestTime: 'Weekday', content: { hook: 'The white bathtub extension — nicknamed "the bathtub" — opened in 2012 amid controversy.', tip: 'Combine with Rijksmuseum and Van Gogh Museum — they\'re all on Museumplein.' } },
  { id: 'albert-cuyp-market', name: 'Albert Cuypmarkt', lat: 52.3555, lng: 4.8959, category: 'popular', description: 'Amsterdam\'s largest outdoor market — 260 stalls of food, flowers, and clothing.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: 'Free · 1–2h', openingHours: '9:00–17:00 (Mon–Sat)', bestTime: 'Saturday morning', content: { hook: 'Been running since 1905 — the stroopwafels fresh off the iron are non-negotiable.', tip: 'Come hungry. The herring stand, syrup waffles, and Dutch cheese are essential.' } },
  { id: 'a-dam-lookout', name: 'A\'DAM Lookout', lat: 52.3842, lng: 4.9017, category: 'popular', description: 'Amsterdam\'s highest observation deck — 360° views from 22 floors up, with a swing.', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', priceAndDuration: '€17.50 · 1h', openingHours: '10:00–22:00', bestTime: 'Sunset', content: { hook: 'The "Over the Edge" swing hangs 100m above the IJ river — not for the faint-hearted.', tip: 'Book the swing separately — it\'s one of the best adrenaline experiences in the city.' } },
  { id: 'heineken-experience', name: 'Heineken Experience', lat: 52.3579, lng: 4.8913, category: 'popular', description: 'Interactive brewery tour in the original 1867 Heineken factory.', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', priceAndDuration: '€25 (incl. 2 beers) · 1.5h', openingHours: '10:30–19:30', bestTime: 'Afternoon', content: { hook: 'Heineken brewed here until 1988 — moved production but kept the building as a museum.', tip: 'Book online to skip the queue. The "Brew You" experience is surprisingly fun.' } },
];

// ─── Restaurants ──────────────────────────────────────────────────────────────

const restaurants: {
  id: string; name: string; lat: number; lng: number;
  type: string; cuisine?: string; price: string;
  openingHours?: string; delivery: boolean; petFriendly: boolean;
  img?: string; content: Record<string, unknown>;
}[] = [
  // Barcelona
  { id: 'el-xampanyet-bcn', name: 'El Xampanyet', lat: 41.3846, lng: 2.1808, type: 'Tapas baras', cuisine: 'Catalan', price: '€€', openingHours: '12:00–16:00, 19:00–23:30', delivery: false, petFriendly: true, content: { description: 'Classic Catalan tapas bar near the Picasso Museum — house cava is legendary.', signature: 'House cava + anchovies', reviews: [{ text: 'The best anchovies in Barcelona.', author: 'María G.', rating: '5/5' }] } },
  { id: 'la-cova-fumada-bcn', name: 'La Cova Fumada', lat: 41.3892, lng: 2.1913, type: 'Jūros gėrybės', cuisine: 'Catalan seafood', price: '€€', openingHours: '9:00–15:00 (Mon–Sat, closed weekends)', delivery: false, petFriendly: false, content: { description: 'Birthplace of the bomba (fried potato ball) — cash only, no reservation.', signature: 'Bomba + calamari', reviews: [{ text: 'Arrive before 9am or wait in line.', author: 'Pau M.', rating: '5/5' }] } },
  { id: 'bar-del-pla-bcn', name: 'Bar del Pla', lat: 41.3847, lng: 2.1774, type: 'Tapas', cuisine: 'Catalan', price: '€€', openingHours: '12:00–23:00', delivery: false, petFriendly: true, content: { description: 'Modern Catalan tapas in the Born — great vermouth selection.', signature: 'Croquetas de jamón', reviews: [] } },
  { id: 'tickets-bcn', name: 'Tickets', lat: 41.3751, lng: 2.1577, type: 'fine', cuisine: 'Modern tapas', price: '€€€€', openingHours: '13:00–15:30, 19:00–22:00 (Tue–Sat)', delivery: false, petFriendly: false, content: { description: 'Albert Adrià\'s famous tapas bar — one of the world\'s best restaurants.', signature: 'Olive oil bonbons', reviews: [{ text: 'Book 2 months ahead. Worth every cent.', author: 'Sophie K.', rating: '5/5' }] } },
  { id: 'cerveceria-catalana-bcn', name: 'Cervecería Catalana', lat: 41.3912, lng: 2.1644, type: 'Tapas', cuisine: 'Spanish', price: '€€', openingHours: '9:00–00:30', delivery: false, petFriendly: true, content: { description: 'Bustling tapas bar on Carrer de Mallorca — best patatas bravas in Eixample.', signature: 'Patatas bravas + montaditos', reviews: [] } },
  { id: 'federal-cafe-bcn', name: 'Federal Café', lat: 41.3780, lng: 2.1675, type: 'breakfast', cuisine: 'Australian café', price: '€€', openingHours: '8:30–16:00', delivery: false, petFriendly: true, content: { description: 'Barcelona\'s original specialty coffee and brunch spot in Sant Antoni.', signature: 'Avocado toast + cortado', reviews: [] } },
  { id: 'la-mar-salada-bcn', name: 'La Mar Salada', lat: 41.3780, lng: 2.1867, type: 'Jūros gėrybės', cuisine: 'Seafood', price: '€€€', openingHours: '13:00–16:00, 20:00–23:00', delivery: false, petFriendly: false, content: { description: 'Seafood restaurant with sea views near Barceloneta — excellent paella.', signature: 'Seafood paella + fideuà', reviews: [] } },
  { id: 'bodega-sepulveda-bcn', name: 'Bodega Sepúlveda', lat: 41.3791, lng: 2.1561, type: 'Baras', cuisine: 'Wine bar', price: '€', openingHours: '18:00–02:00', delivery: false, petFriendly: true, content: { description: 'Tiny neighbourhood wine bar in Sant Antoni — natural wines, cheese, charcuterie.', signature: 'Natural wine + manchego', reviews: [] } },
  { id: 'bar-marsella-bcn', name: 'Bar Marsella', lat: 41.3811, lng: 2.1753, type: 'Baras', cuisine: 'Historic bar', price: '€', openingHours: '22:00–03:00 (Mon–Sat)', delivery: false, petFriendly: false, content: { description: 'Barcelona\'s oldest bar (1820) — dusty absinthe bottles and Hemingway\'s ghost.', signature: 'Absinthe', reviews: [{ text: 'Step back 200 years. Nothing has changed.', author: 'James R.', rating: '5/5' }] } },
  { id: 'els-quatre-gats-bcn', name: 'Els Quatre Gats', lat: 41.3834, lng: 2.1719, type: 'local', cuisine: 'Catalan', price: '€€€', openingHours: '9:00–00:00', delivery: false, petFriendly: false, content: { description: 'Legendary modernista café where Picasso held his first exhibition in 1900.', signature: 'Escudella i carn d\'olla', reviews: [] } },

  // Lisbon
  { id: 'taberna-rua-flores', name: 'Taberna da Rua das Flores', lat: 38.7108, lng: -9.1394, type: 'local', cuisine: 'Portuguese', price: '€€', openingHours: '12:00–15:00, 19:30–22:30 (closed Sun)', delivery: false, petFriendly: false, content: { description: 'Small plates of traditional Portuguese food — one of Lisbon\'s most beloved tascas.', signature: 'Meia desfeita + grilled chouriço', reviews: [{ text: 'The best tasca in Lisbon.', author: 'Ana P.', rating: '5/5' }] } },
  { id: 'a-cevicheria', name: 'A Cevicheria', lat: 38.7158, lng: -9.1484, type: 'Jūros gėrybės', cuisine: 'Peruvian-Portuguese', price: '€€€', openingHours: '12:30–00:00', delivery: false, petFriendly: false, content: { description: 'Outstanding ceviche and seafood with a Portuguese twist — no reservations, queue early.', signature: 'Polvo ceviche', reviews: [] } },
  { id: 'solar-dos-presuntos', name: 'Solar dos Presuntos', lat: 38.7162, lng: -9.1414, type: 'local', cuisine: 'Traditional Portuguese', price: '€€€', openingHours: '12:00–15:30, 19:00–22:30 (closed Sun)', delivery: false, petFriendly: false, content: { description: 'Hanging hams, wine bottles, and old Lisbon family cooking since 1976.', signature: 'Bacalhau à brás + suckling pig', reviews: [] } },
  { id: 'pasteis-belem', name: 'Pastéis de Belém', lat: 38.6976, lng: -9.2038, type: 'breakfast', cuisine: 'Pastry', price: '€', openingHours: '8:00–23:00', delivery: false, petFriendly: true, content: { description: 'The original pastel de nata since 1837 — the recipe is a protected secret.', signature: 'Pastel de nata (warm, with cinnamon)', reviews: [{ text: 'Worth the queue. Always.', author: 'Carla F.', rating: '5/5' }] } },
  { id: 'tasca-do-chico', name: 'Tasca do Chico', lat: 38.7104, lng: -9.1464, type: 'local', cuisine: 'Fado dinner', price: '€€€', openingHours: '19:30–23:30 (Tue–Sat)', delivery: false, petFriendly: false, content: { description: 'Intimate fado house with live music every night — book well in advance.', signature: 'Bacalhau + live fado', reviews: [{ text: 'A defining Lisbon experience.', author: 'Tomas W.', rating: '5/5' }] } },
  { id: 'time-out-market-food', name: 'Time Out Market Lisboa', lat: 38.7071, lng: -9.1477, type: 'popular', cuisine: 'Mixed', price: '€€', openingHours: '10:00–00:00', delivery: false, petFriendly: false, content: { description: 'The original food hall concept — 40+ stalls curated from Lisbon\'s best chefs.', signature: 'Manteigaria pastel de nata + fresh seafood', reviews: [] } },
  { id: 'ze-da-mouraria', name: 'Zé da Mouraria', lat: 38.7165, lng: -9.1349, type: 'local', cuisine: 'Portuguese', price: '€', openingHours: '12:00–15:00 (Mon–Fri only)', delivery: false, petFriendly: false, content: { description: 'Tiny local lunch spot in Mouraria — 5 tables, daily specials on a chalkboard.', signature: 'Peixe do dia + wine carafe', reviews: [{ text: 'Maximum local authenticity. Cash only.', author: 'Rita S.', rating: '5/5' }] } },
  { id: 'cervejaria-ramiro', name: 'Cervejaria Ramiro', lat: 38.7226, lng: -9.1379, type: 'Jūros gėrybės', cuisine: 'Seafood', price: '€€€', openingHours: '12:00–00:30 (closed Mon)', delivery: false, petFriendly: false, content: { description: 'Lisbon\'s legendary seafood beer hall — giant prawns, clams, crab since 1956.', signature: 'Gambas al ajillo + amêijoas à bulhão pato', reviews: [] } },
  { id: 'o-corvo', name: 'O Corvo', lat: 38.7165, lng: -9.1425, type: 'Baras', cuisine: 'Natural wine bar', price: '€€', openingHours: '18:00–00:00 (closed Sun–Mon)', delivery: false, petFriendly: true, content: { description: 'Tiny natural wine bar in Bairro Alto — cork-covered ceiling, excellent cheese.', signature: 'Natural wine + cured meats', reviews: [] } },
  { id: 'bettina-corallo', name: 'Bettina & Niccolo Corallo', lat: 38.7138, lng: -9.1479, type: 'Kava', cuisine: 'Chocolate & coffee', price: '€', openingHours: '10:00–20:00 (closed Sun)', delivery: false, petFriendly: true, content: { description: 'São Tomé single-origin chocolate and specialty coffee — a hidden gem.', signature: 'Hot chocolate + pralines', reviews: [] } },

  // Rome
  { id: 'da-enzo-al-29', name: 'Da Enzo al 29', lat: 41.8887, lng: 12.4730, type: 'local', cuisine: 'Roman trattoria', price: '€€', openingHours: '12:30–15:00, 19:30–23:00 (closed Sun dinner)', delivery: false, petFriendly: false, content: { description: 'Trastevere institution — classic Roman pasta done perfectly since 1935.', signature: 'Cacio e pepe + coda alla vaccinara', reviews: [{ text: 'The real deal. Book a week ahead.', author: 'Marco B.', rating: '5/5' }] } },
  { id: 'tonnarello-rome', name: 'Tonnarello', lat: 41.8883, lng: 12.4701, type: 'local', cuisine: 'Roman', price: '€€', openingHours: '19:00–01:00', delivery: false, petFriendly: true, content: { description: 'Lively Trastevere trattoria with outdoor tables and live music on summer nights.', signature: 'Spaghetti alla carbonara', reviews: [] } },
  { id: 'supplit-roma', name: 'Supplì Roma', lat: 41.8892, lng: 12.4724, type: 'popular', cuisine: 'Street food', price: '€', openingHours: '11:00–22:00', delivery: false, petFriendly: true, content: { description: 'Best supplì (fried rice balls) in Rome — queue out the door on weekends.', signature: 'Supplì al telefono (classic + spicy)', reviews: [] } },
  { id: 'armando-al-pantheon', name: 'Armando al Pantheon', lat: 41.8987, lng: 12.4762, type: 'local', cuisine: 'Roman', price: '€€€', openingHours: '13:00–15:00, 19:00–23:00 (closed Sat dinner, Sun)', delivery: false, petFriendly: false, content: { description: 'Legendary family restaurant steps from the Pantheon — been here since 1961.', signature: 'Rigatoni alla pajata + artichokes alla romana', reviews: [] } },
  { id: 'pizzarium-bonci', name: 'Pizzarium Bonci', lat: 41.9048, lng: 12.4576, type: 'popular', cuisine: 'Pizza al taglio', price: '€', openingHours: '11:00–22:00', delivery: false, petFriendly: false, content: { description: 'Gabriele Bonci\'s world-famous pizza by the slice near Vatican — sold by weight.', signature: 'Potato + rosemary pizza bianca', reviews: [{ text: 'The best pizza in Rome. Full stop.', author: 'Giulia R.', rating: '5/5' }] } },
  { id: 'roscioli-rome', name: 'Roscioli', lat: 41.8957, lng: 12.4749, type: 'fine', cuisine: 'Roman deli-restaurant', price: '€€€', openingHours: '12:30–16:00, 18:30–00:00 (Mon–Sat)', delivery: false, petFriendly: false, content: { description: 'Part deli, part restaurant — extraordinary Italian ingredients, best carbonara in Rome.', signature: 'Carbonara + buffalo mozzarella', reviews: [] } },
  { id: 'il-sorpasso', name: 'Il Sorpasso', lat: 41.9019, lng: 12.4612, type: 'Baras', cuisine: 'Aperitivo', price: '€€', openingHours: '7:30–00:00', delivery: false, petFriendly: true, content: { description: 'Prati neighbourhood favourite — excellent aperitivo, charcuterie, and natural wines.', signature: 'Aperol spritz + salumi board', reviews: [] } },
  { id: 'forno-campo-de-fiori', name: 'Forno Campo de\' Fiori', lat: 41.8963, lng: 12.4720, type: 'breakfast', cuisine: 'Bakery', price: '€', openingHours: '7:30–14:30, 16:45–20:00 (closed Sun)', delivery: false, petFriendly: false, content: { description: 'Rome\'s finest bakery — the square pizza bianca here is worth the trip alone.', signature: 'Pizza bianca con mortadella', reviews: [] } },
  { id: 'grazia-graziella', name: 'Grazia & Graziella', lat: 41.8899, lng: 12.4920, type: 'local', cuisine: 'Roman', price: '€€', openingHours: '12:30–15:00, 19:30–23:00 (Tue–Sun)', delivery: false, petFriendly: false, content: { description: 'Hidden Testaccio neighbourhood gem — traditional Roman Jewish cooking.', signature: 'Carciofi alla giudia + tonnarelli cacio e pepe', reviews: [] } },
  { id: 'osteria-enoteca-rome', name: 'Osteria dell\'Enoteca', lat: 41.9001, lng: 12.4831, type: 'fine', cuisine: 'Roman wine bar', price: '€€€', openingHours: '19:30–23:30 (Tue–Sat)', delivery: false, petFriendly: false, content: { description: 'Intimate wine bar near Trevi with exceptional Italian wine list and seasonal menu.', signature: 'Seasonal tasting menu + aged Barolo', reviews: [] } },

  // Paris
  { id: 'le-comptoir-relais', name: 'Le Comptoir du Relais', lat: 48.8520, lng: 2.3399, type: 'local', cuisine: 'French bistro', price: '€€€', openingHours: '12:00–00:00', delivery: false, petFriendly: false, content: { description: 'Yves Camdeborde\'s celebrated Saint-Germain bistro — queue for weekday lunch.', signature: 'Pâté en croûte + steak tartare', reviews: [{ text: 'The best bistro in Paris. No question.', author: 'Claire D.', rating: '5/5' }] } },
  { id: 'septime-paris', name: 'Septime', lat: 48.8522, lng: 2.3807, type: 'fine', cuisine: 'Modern French', price: '€€€€', openingHours: '12:15–13:30, 19:15–22:00 (Mon–Fri)', delivery: false, petFriendly: false, content: { description: 'One of Paris\'s hottest neo-bistros — seasonal tasting menu, natural wines.', signature: '4-course seasonal menu', reviews: [{ text: 'Book exactly 2 months ahead at 9am when slots open.', author: 'Thomas L.', rating: '5/5' }] } },
  { id: 'frenchie-paris', name: 'Frenchie', lat: 48.8625, lng: 2.3505, type: 'fine', cuisine: 'Modern French', price: '€€€', openingHours: '19:00–23:00 (Mon–Fri)', delivery: false, petFriendly: false, content: { description: 'Greg Marchand\'s tiny restaurant that put Rue du Nil on the food map.', signature: 'Seasonal market menu', reviews: [] } },
  { id: 'las-du-fallafel', name: 'L\'As du Fallafel', lat: 48.8570, lng: 2.3582, type: 'popular', cuisine: 'Israeli street food', price: '€', openingHours: '11:00–00:30 (closed Shabbat Fri sunset–Sat)', delivery: false, petFriendly: false, content: { description: 'Legendary Marais falafel — the special with all the toppings is iconic.', signature: 'Falafel special with aubergine + tahini', reviews: [] } },
  { id: 'cafe-de-flore', name: 'Café de Flore', lat: 48.8537, lng: 2.3329, type: 'breakfast', cuisine: 'Parisian café', price: '€€€', openingHours: '7:30–01:30', delivery: false, petFriendly: true, content: { description: 'Saint-Germain\'s most famous café — Sartre and de Beauvoir worked here daily.', signature: 'Café crème + croque monsieur', reviews: [] } },
  { id: 'brasserie-lipp', name: 'Brasserie Lipp', lat: 48.8535, lng: 2.3335, type: 'local', cuisine: 'Alsatian brasserie', price: '€€€', openingHours: '12:00–23:45', delivery: false, petFriendly: false, content: { description: 'Grand old brasserie where French politicians have lunched since 1880.', signature: 'Choucroute garnie + pied de porc', reviews: [] } },
  { id: 'breizh-cafe-paris', name: 'Breizh Café', lat: 48.8569, lng: 2.3579, type: 'local', cuisine: 'Breton crêperie', price: '€€', openingHours: '11:30–23:00 (closed Tue)', delivery: false, petFriendly: false, content: { description: 'The finest Breton crêpes in Paris — artisan cidre and handmade salted caramel.', signature: 'Complète crêpe + salted caramel galette', reviews: [] } },
  { id: 'pierre-herme-paris', name: 'Pierre Hermé', lat: 48.8529, lng: 2.3345, type: 'breakfast', cuisine: 'Patisserie', price: '€€', openingHours: '10:00–19:00', delivery: false, petFriendly: false, content: { description: 'The "Picasso of pastry" — macarons that are worth queuing for.', signature: 'Ispahan macaron (rose, lychee, raspberry)', reviews: [] } },
  { id: 'marche-enfants-rouges', name: 'Marché des Enfants Rouges', lat: 48.8620, lng: 2.3600, type: 'popular', cuisine: 'Market', price: '€–€€€', openingHours: '8:30–20:30 (closed Mon)', delivery: false, petFriendly: true, content: { description: 'Paris\'s oldest covered market (1615) — Lebanese, Japanese, Italian, and French stalls.', signature: 'Lebanese mezze plate + Moroccan couscous', reviews: [] } },
  { id: 'le-jules-verne', name: 'Le Jules Verne', lat: 48.8582, lng: 2.2942, type: 'fine', cuisine: 'French gastronomic', price: '€€€€', openingHours: '12:00–13:30, 19:00–21:30', delivery: false, petFriendly: false, content: { description: 'Frédéric Anton\'s Michelin-starred restaurant inside the Eiffel Tower, 2nd floor.', signature: 'Seasonal tasting menu with Eiffel Tower view', reviews: [] } },

  // Kyoto
  { id: 'nishiki-warai', name: 'Nishiki Warai', lat: 35.0050, lng: 135.7650, type: 'local', cuisine: 'Kyoto cuisine', price: '€€', openingHours: '11:30–14:30, 17:00–22:00', delivery: false, petFriendly: false, content: { description: 'Traditional Kyoto obanzai (small dishes) near Nishiki Market.', signature: 'Obanzai set + miso soup', reviews: [] } },
  { id: 'tosuiro-kyoto', name: 'Tosuiro', lat: 35.0110, lng: 135.7720, type: 'fine', cuisine: 'Tofu kaiseki', price: '€€€€', openingHours: '12:00–14:00, 17:00–21:00 (closed Wed)', delivery: false, petFriendly: false, content: { description: 'Exquisite tofu kaiseki in a 200-year-old Kyoto machiya townhouse.', signature: 'Tofu kaiseki 9-course dinner', reviews: [{ text: 'The most beautiful meal in Kyoto.', author: 'Yuki H.', rating: '5/5' }] } },
  { id: 'katsukura-kyoto', name: 'Katsukura', lat: 35.0068, lng: 135.7590, type: 'popular', cuisine: 'Tonkatsu', price: '€€', openingHours: '11:00–21:30', delivery: false, petFriendly: false, content: { description: 'Kyoto\'s most respected tonkatsu restaurant — grind your own sesame at the table.', signature: 'Rosu katsu set + sesame sauce', reviews: [] } },
  { id: 'biotei-kyoto', name: 'Biotei', lat: 35.0052, lng: 135.7670, type: 'local', cuisine: 'Vegetarian', price: '€€', openingHours: '11:30–14:30 (closed weekends)', delivery: false, petFriendly: false, content: { description: 'Kyoto\'s finest vegetarian lunch counter — Buddhist-inspired seasonal cuisine.', signature: 'Daily vegetarian bento', reviews: [] } },
  { id: 'misoka-kawamichiya', name: 'Misoka-an Kawamichiya', lat: 35.0098, lng: 135.7736, type: 'local', cuisine: 'Soba', price: '€€', openingHours: '11:00–20:30 (closed Thu)', delivery: false, petFriendly: false, content: { description: 'Historic soba restaurant in a 300-year-old machiya — hand-cut buckwheat noodles.', signature: 'Nishin soba (herring soba)', reviews: [] } },
  { id: 'gion-kappa', name: 'Gion Kappa', lat: 35.0042, lng: 135.7740, type: 'popular', cuisine: 'Kushikatsu', price: '€€', openingHours: '17:00–23:00 (closed Mon)', delivery: false, petFriendly: false, content: { description: 'Standing kushikatsu (deep-fried skewers) bar in Gion — no double dipping rule.', signature: 'Kushikatsu assortment + cold Sapporo', reviews: [] } },
  { id: 'ippudo-kyoto', name: 'Ippudo Kyoto', lat: 35.0063, lng: 135.7614, type: 'popular', cuisine: 'Ramen', price: '€', openingHours: '11:00–23:00', delivery: false, petFriendly: false, content: { description: 'Fukuoka-style tonkotsu ramen in central Kyoto — rich pork bone broth.', signature: 'Shiromaru classic ramen', reviews: [] } },
  { id: 'yoshikawa-kyoto', name: 'Yoshikawa', lat: 35.0087, lng: 135.7672, type: 'fine', cuisine: 'Tempura kaiseki', price: '€€€€', openingHours: '11:30–14:00, 17:30–21:00', delivery: false, petFriendly: false, content: { description: 'Counter tempura kaiseki in a serene garden setting — Kyoto at its most refined.', signature: 'Tempura kaiseki course', reviews: [] } },
  { id: 'kakiden-kyoto', name: 'Kakiden', lat: 35.0107, lng: 135.7682, type: 'fine', cuisine: 'Kaiseki', price: '€€€€', openingHours: '12:00–14:30, 17:00–21:00', delivery: false, petFriendly: false, content: { description: 'Renowned kaiseki restaurant in central Kyoto — seasonal flavours, impeccable presentation.', signature: 'Seasonal kaiseki course', reviews: [] } },
  { id: 'imahan-kyoto', name: 'Imahan', lat: 35.0072, lng: 135.7588, type: 'fine', cuisine: 'Sukiyaki/Shabu-shabu', price: '€€€€', openingHours: '11:30–21:00', delivery: false, petFriendly: false, content: { description: 'Premium wagyu sukiyaki and shabu-shabu in private tatami rooms.', signature: 'Wagyu sukiyaki set', reviews: [] } },

  // Berlin
  { id: 'zur-letzten-instanz', name: 'Zur letzten Instanz', lat: 52.5162, lng: 13.4115, type: 'local', cuisine: 'Tradicinė vokiečių virtuvė', price: '€€', openingHours: '12:00–23:00 (išsk. pirmadienį)', delivery: false, petFriendly: false, content: { description: 'Berlyno seniausias restoranas (1621 m.) — autentiškas soleris ir raudonkopūstis.', signature: 'Kassler su soleriu ir raudonkopūsčiu', reviews: [{ text: 'Tikras Berlyno skonis — privalu aplankyti.', author: 'Klaus M.', rating: '5/5' }] } },
  { id: 'mustafas-gemuse-kebap', name: 'Mustafa\'s Gemüse Kebap', lat: 52.4947, lng: 13.3881, type: 'popular', cuisine: 'Kebabas', price: '€', openingHours: '10:00–03:00', delivery: false, petFriendly: false, content: { description: 'Kreuzbergo legendinis daržovių kebabas — eilė visada verta laukimo.', signature: 'Daržovių kebabas su feta ir šparagais', reviews: [] } },
  { id: 'nobelhart-schmutzig', name: 'Nobelhart & Schmutzig', lat: 52.5067, lng: 13.3866, type: 'fine', cuisine: 'Modernioji vokiečių', price: '€€€€', openingHours: '18:30–00:00 (išsk. sekmadienį–pirmadienį)', delivery: false, petFriendly: false, content: { description: 'Vienas žvaigždžių restoranų — tik vietiniai produktai, be puošybos.', signature: '10 patiekalų degustacinis meniu', reviews: [] } },
  { id: 'spreegold-berlin', name: 'Spreegold', lat: 52.5139, lng: 13.4230, type: 'breakfast', cuisine: 'Kavinė / pusryčiai', price: '€€', openingHours: '9:00–17:00', delivery: false, petFriendly: true, content: { description: 'Mėgstamiausia berlyniečių brunch vieta prie Šprė upės.', signature: 'Avokadų skrebučiai + holubtsy', reviews: [] } },
  { id: 'katz-orange-berlin', name: 'Katz Orange', lat: 52.5268, lng: 13.4005, type: 'local', cuisine: 'Ūkio virtuvė', price: '€€€', openingHours: '18:00–23:00', delivery: false, petFriendly: false, content: { description: 'Ūkio meniu kiekvieną savaitę — šviežūs vietiniai produktai istoriniame pastote.', signature: '12 val. troškintas kiaulienos kaklas', reviews: [] } },

  // Amsterdam
  { id: 'de-kas-amsterdam', name: 'De Kas', lat: 52.3571, lng: 4.9259, type: 'fine', cuisine: 'Farm-to-table', price: '€€€€', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', openingHours: '12:00–14:00, 18:30–21:30 (Mon–Fri)', delivery: false, petFriendly: false, content: { description: 'Restaurant in a 1926 greenhouse — vegetables harvested 100m from your table.', signature: 'Fixed seasonal menu (changes daily)', reviews: [{ text: 'The freshest, most beautiful meal in Amsterdam.', author: 'Sophie V.', rating: '5/5' }] } },
  { id: 'van-wonderen-amsterdam', name: 'Van Wonderen Stroopwafels', lat: 52.3731, lng: 4.8946, type: 'popular', cuisine: 'Dutch pastry', price: '€', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', openingHours: '9:00–19:00', delivery: false, petFriendly: false, content: { description: 'Artisan stroopwafels fresh off the iron — Amsterdam\'s most Instagrammed food stop.', signature: 'Classic stroopwafel + Nutella drizzle', reviews: [] } },
  { id: 'brouwerij-t-ij', name: 'Brouwerij \'t IJ', lat: 52.3661, lng: 4.9241, type: 'local', cuisine: 'Craft brewery', price: '€€', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', openingHours: '14:00–20:00', delivery: false, petFriendly: true, content: { description: 'Amsterdam\'s iconic windmill brewery — tasting room inside a working 1814 mill.', signature: 'Columbus IPA + Natte dubbel', reviews: [] } },
  { id: 'cafe-de-jaren', name: 'Café de Jaren', lat: 52.3684, lng: 4.8951, type: 'breakfast', cuisine: 'Grand café', price: '€€', img: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80', openingHours: '10:00–01:00', delivery: false, petFriendly: true, content: { description: 'Amsterdam\'s grandest café — high ceilings, waterfront terrace, all-day menu.', signature: 'Dutch apple pie + fresh orange juice', reviews: [] } },
  { id: 'foodhallen-amsterdam', name: 'Foodhallen', lat: 52.3634, lng: 4.8694, type: 'popular', cuisine: 'Food hall', price: '€€', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', openingHours: '11:00–23:30', delivery: false, petFriendly: false, content: { description: 'Indoor street food market in a converted tram depot — 20+ vendors.', signature: 'Bao buns + craft beer', reviews: [] } },
  { id: 'brasserie-harkema', name: 'Brasserie Harkema', lat: 52.3718, lng: 4.8952, type: 'local', cuisine: 'Modern French-Dutch', price: '€€€', img: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80', openingHours: '12:00–23:30', delivery: false, petFriendly: false, content: { description: 'Stylish brasserie in a former tobacco factory near the Spui — Amsterdam favourite.', signature: 'Beef tartare + crème brûlée', reviews: [] } },
  { id: 'raan-amsterdam', name: 'Raan', lat: 52.3693, lng: 4.9011, type: 'popular', cuisine: 'Thai street food', price: '€€', img: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80', openingHours: '12:00–22:00 (closed Mon)', delivery: true, petFriendly: false, content: { description: 'Authentic Thai street food in the heart of Amsterdam — tiny, always packed.', signature: 'Pad kra pao + mango sticky rice', reviews: [] } },
  { id: 'moeders-amsterdam', name: 'Moeders', lat: 52.3747, lng: 4.8777, type: 'local', cuisine: 'Dutch home cooking', price: '€€', img: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80', openingHours: '17:00–23:00 (Sat–Sun from 12:00)', delivery: false, petFriendly: false, content: { description: 'Walls covered in family photos, mismatched plates — the most Dutch restaurant experience.', signature: 'Stamppot met rookworst + Dutch apple pie', reviews: [{ text: 'The warmest, most charming restaurant in Amsterdam.', author: 'Anna P.', rating: '5/5' }] } },
  { id: 'pllek-amsterdam', name: 'Pllek', lat: 52.3882, lng: 4.9086, type: 'local', cuisine: 'Contemporary café-restaurant', price: '€€', img: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80', openingHours: '10:00–00:00', delivery: false, petFriendly: true, content: { description: 'Container restaurant on the north bank of the IJ — terrace with city skyline views.', signature: 'Grilled fish + natural wine', reviews: [] } },
  { id: 'teds-amsterdam', name: 'Ted\'s', lat: 52.3773, lng: 4.9005, type: 'breakfast', cuisine: 'Brunch', price: '€€', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', openingHours: '8:00–17:00', delivery: false, petFriendly: true, content: { description: 'Amsterdam\'s most popular brunch spot — freshly baked bread, local eggs, great coffee.', signature: 'Eggs Benedict + house granola', reviews: [] } },
];

// ─── Hotels ───────────────────────────────────────────────────────────────────

const hotels: {
  id: string; name: string; lat: number; lng: number;
  tier: HotelTier; area: string; pricePerNight: number; rating: string;
  img: string; content: Record<string, unknown>;
}[] = [
  // Barcelona
  { id: 'hotel-arts-bcn', name: 'Hotel Arts Barcelona', lat: 41.3866, lng: 2.1967, tier: 'comfort', area: 'Barceloneta', pricePerNight: 380, rating: '9.1', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Beachfront', 'Ritz-Carlton managed', 'Frank Gehry fish sculpture below'], amenities: ['Pool', 'Spa', 'Wi-Fi', 'Gym', 'Restaurant', 'Bar'], walkTo: '5 min to Barceloneta beach', roomTypes: [] } },
  { id: 'w-barcelona', name: 'W Barcelona', lat: 41.3727, lng: 2.1885, tier: 'comfort', area: 'Port Olímpic', pricePerNight: 320, rating: '8.7', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', content: { highlights: ['Sail-shaped tower', 'Wet deck pool', 'BRAVO24 rooftop restaurant'], amenities: ['Infinity pool', 'Spa', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '2 min to beach', roomTypes: [] } },
  { id: 'generator-bcn', name: 'Generator Barcelona', lat: 41.3941, lng: 2.1535, tier: 'budget', area: 'Gràcia', pricePerNight: 35, rating: '8.3', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Rooftop bar', 'Social atmosphere', 'Design hostel'], amenities: ['Wi-Fi', 'Bar', 'Communal kitchen'], walkTo: '10 min to Park Güell', roomTypes: [] } },
  { id: 'praktik-rambla-bcn', name: 'Hotel Praktik Rambla', lat: 41.3809, lng: 2.1700, tier: 'mid', area: 'Las Ramblas', pricePerNight: 120, rating: '8.5', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Balconies over Las Ramblas', 'Modernista building', 'Central location'], amenities: ['Wi-Fi', 'Air conditioning', 'Restaurant'], walkTo: '5 min to Boqueria', roomTypes: [] } },
  { id: 'motel-one-ciutadella-bcn', name: 'Motel One Barcelona-Ciutadella', lat: 41.3889, lng: 2.1863, tier: 'mid', area: 'El Born', pricePerNight: 110, rating: '8.6', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Design hotel at budget price', 'Near Ciudadela park', 'Rooftop bar'], amenities: ['Wi-Fi', 'Bar', 'Gym'], walkTo: '10 min to Barceloneta', roomTypes: [] } },
  { id: 'catalonia-born-bcn', name: 'Catalonia Born', lat: 41.3862, lng: 2.1818, tier: 'mid', area: 'El Born', pricePerNight: 140, rating: '8.8', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Pool on roof terrace', 'El Born neighbourhood', 'Historic building'], amenities: ['Pool', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '5 min to Picasso Museum', roomTypes: [] } },
  { id: 'equity-point-gothic-bcn', name: 'Equity Point Gothic', lat: 41.3831, lng: 2.1774, tier: 'budget', area: 'Gothic Quarter', pricePerNight: 28, rating: '7.9', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Best location in the Gothic Quarter', 'Rooftop terrace'], amenities: ['Wi-Fi', 'Communal kitchen', 'Terrace'], walkTo: '2 min to Cathedral', roomTypes: [] } },
  { id: 'casa-camper-bcn', name: 'Hotel Casa Camper', lat: 41.3826, lng: 2.1731, tier: 'comfort', area: 'Raval', pricePerNight: 280, rating: '8.9', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Free 24h snack bar', 'Unique split-level rooms', 'Sustainable design'], amenities: ['Wi-Fi', 'Free snack bar', 'Gym'], walkTo: '5 min to Boqueria', roomTypes: [] } },
  { id: 'h10-marina-bcn', name: 'H10 Marina Barcelona', lat: 41.3940, lng: 2.1975, tier: 'mid', area: 'Poblenou', pricePerNight: 160, rating: '8.7', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Rooftop pool', 'Near Rambla del Poblenou', 'Port views'], amenities: ['Pool', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '10 min to beach', roomTypes: [] } },
  { id: 'chic-basic-born-bcn', name: 'Chic&Basic Born', lat: 41.3853, lng: 2.1820, tier: 'budget', area: 'El Born', pricePerNight: 65, rating: '8.2', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', content: { highlights: ['Trendy El Born location', 'LED mood lighting rooms', 'Patio'], amenities: ['Wi-Fi', 'Air conditioning'], walkTo: '3 min to Picasso Museum', roomTypes: [] } },

  // Lisbon
  { id: 'bairro-alto-hotel', name: 'Bairro Alto Hotel', lat: 38.7111, lng: -9.1433, tier: 'comfort', area: 'Chiado', pricePerNight: 350, rating: '9.3', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Panoramic rooftop bar', 'Walking distance to everything', 'Contemporary design'], amenities: ['Spa', 'Wi-Fi', 'Gym', 'Restaurant', 'Rooftop bar'], walkTo: '5 min to LX Factory tram', roomTypes: [] } },
  { id: 'lumiares-lisbon', name: 'The Lumiares Hotel', lat: 38.7121, lng: -9.1453, tier: 'comfort', area: 'Bairro Alto', pricePerNight: 280, rating: '9.0', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Apartment-style suites', 'Views over Lisbon', '18th-century building'], amenities: ['Pool', 'Wi-Fi', 'Restaurant'], walkTo: '5 min to Miradouro de São Pedro', roomTypes: [] } },
  { id: 'lisbon-destination-hostel', name: 'Lisbon Destination Hostel', lat: 38.7117, lng: -9.1392, tier: 'budget', area: 'Rossio', pricePerNight: 25, rating: '9.2', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Inside Rossio train station', 'Rooftop terrace', 'Top-rated hostel in Europe'], amenities: ['Wi-Fi', 'Terrace', 'Communal kitchen'], walkTo: '10 min to Alfama on foot', roomTypes: [] } },
  { id: 'hotel-avenida-palace', name: 'Hotel Avenida Palace', lat: 38.7153, lng: -9.1415, tier: 'comfort', area: 'Baixa', pricePerNight: 240, rating: '8.8', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Belle Époque building (1892)', 'Inside Rossio station', 'Ballroom events'], amenities: ['Wi-Fi', 'Restaurant', 'Bar'], walkTo: '5 min to Praça do Comércio', roomTypes: [] } },
  { id: 'my-story-ouro', name: 'MY Story Hotel Ouro', lat: 38.7143, lng: -9.1383, tier: 'mid', area: 'Baixa', pricePerNight: 110, rating: '8.5', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Central Baixa location', 'Modern design', 'Rooftop'], amenities: ['Wi-Fi', 'Air conditioning', 'Rooftop'], walkTo: '2 min to Praça do Comércio', roomTypes: [] } },
  { id: 'hotel-do-chiado', name: 'Hotel do Chiado', lat: 38.7112, lng: -9.1427, tier: 'mid', area: 'Chiado', pricePerNight: 190, rating: '8.7', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Rooftop bar with castle views', 'Pombaline building', 'Chiado centre'], amenities: ['Wi-Fi', 'Rooftop bar', 'Restaurant'], walkTo: '5 min to Bairro Alto', roomTypes: [] } },
  { id: 'memmo-alfama', name: 'Memmo Alfama', lat: 38.7129, lng: -9.1306, tier: 'comfort', area: 'Alfama', pricePerNight: 310, rating: '9.1', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Terraced pool with Tejo views', 'In the heart of Alfama', 'Adults only'], amenities: ['Pool', 'Wi-Fi', 'Restaurant', 'Bar'], walkTo: '5 min to São Jorge Castle', roomTypes: [] } },
  { id: 'selina-secret-garden', name: 'Selina Secret Garden Lisbon', lat: 38.7139, lng: -9.1467, tier: 'budget', area: 'Bairro Alto', pricePerNight: 40, rating: '8.1', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Co-working space', 'Secret courtyard garden', 'Surf-hostel vibe'], amenities: ['Wi-Fi', 'Co-working', 'Bar', 'Garden'], walkTo: '5 min to Bica funicular', roomTypes: [] } },
  { id: 'turim-lisboa', name: 'Turim Lisboa Hotel', lat: 38.7181, lng: -9.1378, tier: 'mid', area: 'Avenida', pricePerNight: 130, rating: '8.3', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Near Avenida da Liberdade', 'Quiet side street', 'Good value'], amenities: ['Wi-Fi', 'Gym', 'Restaurant'], walkTo: '10 min to Chiado', roomTypes: [] } },
  { id: 'casa-amora-lisbon', name: 'Casa Amora', lat: 38.7133, lng: -9.1440, tier: 'budget', area: 'Bairro Alto', pricePerNight: 70, rating: '8.6', img: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=800', content: { highlights: ['Boutique guesthouse', 'Home-like atmosphere', 'Azulejo tiles'], amenities: ['Wi-Fi', 'Terrace'], walkTo: '3 min to Miradouro de São Pedro', roomTypes: [] } },

  // Rome
  { id: 'hotel-de-russie-rome', name: 'Hotel de Russie', lat: 41.9062, lng: 12.4790, tier: 'comfort', area: 'Piazza del Popolo', pricePerNight: 550, rating: '9.5', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Terraced garden', 'Le Jardin de Russie restaurant', 'Spa Rocco Forte'], amenities: ['Pool', 'Spa', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '5 min to Piazza del Popolo', roomTypes: [] } },
  { id: 'first-roma-arte', name: 'The First Roma Arte', lat: 41.9077, lng: 12.4806, tier: 'comfort', area: 'Via Veneto', pricePerNight: 320, rating: '9.0', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Rooftop with Borghese views', 'Art gallery hotel', 'ACQUA restaurant'], amenities: ['Rooftop', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '10 min to Spanish Steps', roomTypes: [] } },
  { id: 'hotel-campo-fiori-rome', name: 'Hotel Campo de\' Fiori', lat: 41.8965, lng: 12.4726, tier: 'mid', area: 'Centro Storico', pricePerNight: 160, rating: '8.5', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Rooftop terrace over Campo de\' Fiori', 'Medieval building', 'Steps from Pantheon'], amenities: ['Terrace', 'Wi-Fi'], walkTo: '5 min to Campo de\' Fiori', roomTypes: [] } },
  { id: 'hotel-panda-rome', name: 'Hotel Panda', lat: 41.9052, lng: 12.4818, tier: 'budget', area: 'Spagna', pricePerNight: 60, rating: '7.8', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Steps from Spanish Steps', 'Clean and simple', 'Best location for price'], amenities: ['Wi-Fi', 'Air conditioning'], walkTo: '2 min to Spanish Steps', roomTypes: [] } },
  { id: 'mama-shelter-rome', name: 'Mama Shelter Roma', lat: 41.8953, lng: 12.5018, tier: 'mid', area: 'Pigneto', pricePerNight: 140, rating: '8.6', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Trendy Pigneto neighbourhood', 'Rooftop pool', 'Quirky design'], amenities: ['Pool', 'Wi-Fi', 'Restaurant', 'Bar'], walkTo: '20 min to Colosseum by metro', roomTypes: [] } },
  { id: 'hotel-santa-maria-trastevere', name: 'Hotel Santa Maria', lat: 41.8875, lng: 12.4694, tier: 'mid', area: 'Trastevere', pricePerNight: 150, rating: '8.8', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Orange tree courtyard', 'In the heart of Trastevere', '16th-century convent'], amenities: ['Wi-Fi', 'Courtyard', 'Bikes'], walkTo: '2 min to Piazza Santa Maria', roomTypes: [] } },
  { id: 'ostello-bello-rome', name: 'Ostello Bello Roma', lat: 41.8977, lng: 12.4869, tier: 'budget', area: 'Termini', pricePerNight: 30, rating: '9.0', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Free dinner included', 'Social community hostel', 'Central Termini'], amenities: ['Wi-Fi', 'Free dinner', 'Bar', 'Communal kitchen'], walkTo: '2 min to Termini station', roomTypes: [] } },
  { id: 'portrait-roma', name: 'Portrait Roma', lat: 41.9008, lng: 12.4798, tier: 'comfort', area: 'Piazza di Spagna', pricePerNight: 680, rating: '9.6', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Salvatore Ferragamo property', 'Rooftop bar over Spanish Steps', 'Suite-only'], amenities: ['Rooftop', 'Wi-Fi', 'Concierge', 'Room service'], walkTo: '1 min to Spanish Steps', roomTypes: [] } },
  { id: 'hotel-adriano-rome', name: 'Hotel Adriano', lat: 41.9003, lng: 12.4761, tier: 'mid', area: 'Pantheon', pricePerNight: 175, rating: '8.7', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Rooftop terrace', 'Pantheon steps away', 'Historic palazzo'], amenities: ['Terrace', 'Wi-Fi', 'Air conditioning'], walkTo: '2 min to Pantheon', roomTypes: [] } },
  { id: 'fortyseven-rome', name: 'Fortyseven Hotel', lat: 41.8924, lng: 12.4835, tier: 'mid', area: 'Aventino', pricePerNight: 155, rating: '8.9', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', content: { highlights: ['Rooftop with Palatine Hill views', 'Aventino quiet street', 'Contemporary design'], amenities: ['Rooftop', 'Wi-Fi', 'Restaurant'], walkTo: '10 min to Colosseum', roomTypes: [] } },

  // Paris
  { id: 'hotel-plaza-athenee', name: 'Hôtel Plaza Athénée', lat: 48.8650, lng: 2.3025, tier: 'comfort', area: 'Champs-Élysées', pricePerNight: 950, rating: '9.4', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Alain Ducasse restaurant', 'Iconic red geranium facade', 'Dior Institut Spa'], amenities: ['Spa', 'Wi-Fi', 'Gym', 'Restaurant', 'Bar'], walkTo: '5 min to Eiffel Tower by car', roomTypes: [] } },
  { id: 'generator-paris', name: 'Generator Paris', lat: 48.8790, lng: 2.3685, tier: 'budget', area: 'Belleville', pricePerNight: 35, rating: '8.2', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Rooftop bar', 'Design hostel', 'Near Canal Saint-Martin'], amenities: ['Wi-Fi', 'Rooftop bar', 'Restaurant'], walkTo: '20 min to Marais by metro', roomTypes: [] } },
  { id: 'hotel-du-temps-paris', name: 'Hôtel du Temps', lat: 48.8714, lng: 2.3481, tier: 'mid', area: 'Montmartre', pricePerNight: 130, rating: '8.6', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Vintage design', 'Near Sacré-Cœur', 'Quiet Montmartre street'], amenities: ['Wi-Fi', 'Bar'], walkTo: '10 min to Sacré-Cœur', roomTypes: [] } },
  { id: 'mama-shelter-east-paris', name: 'Mama Shelter Paris East', lat: 48.8641, lng: 2.3851, tier: 'mid', area: 'Gambetta', pricePerNight: 120, rating: '8.7', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Philippe Starck design', 'Rooftop terrace', 'Pizza restaurant'], amenities: ['Wi-Fi', 'Gym', 'Restaurant', 'Rooftop'], walkTo: '15 min to Marais by metro', roomTypes: [] } },
  { id: 'hotel-duo-paris', name: 'Hôtel Duo', lat: 48.8563, lng: 2.3548, tier: 'mid', area: 'Marais', pricePerNight: 165, rating: '8.8', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Best Marais location', 'Modern design', 'Near Centre Pompidou'], amenities: ['Gym', 'Wi-Fi', 'Bar'], walkTo: '5 min to Centre Pompidou', roomTypes: [] } },
  { id: 'mije-hostels-paris', name: 'MIJE Marais', lat: 48.8558, lng: 2.3573, tier: 'budget', area: 'Marais', pricePerNight: 40, rating: '8.0', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['17th-century hôtel particulier', 'Marais heart', 'Courtyard breakfasts'], amenities: ['Wi-Fi', 'Courtyard', 'Breakfast'], walkTo: '5 min to Place des Vosges', roomTypes: [] } },
  { id: 'la-louisiane-paris', name: 'La Louisiane', lat: 48.8541, lng: 2.3355, tier: 'budget', area: 'Saint-Germain', pricePerNight: 85, rating: '7.8', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Existentialist history (Camus, de Beauvoir)', 'Saint-Germain centre', 'Good value'], amenities: ['Wi-Fi', 'Air conditioning'], walkTo: '3 min to Café de Flore', roomTypes: [] } },
  { id: 'grands-boulevards-paris', name: 'Hôtel des Grands Boulevards', lat: 48.8669, lng: 2.3459, tier: 'comfort', area: 'Grands Boulevards', pricePerNight: 280, rating: '9.1', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Rooftop garden bar', 'Napoleon III building', 'Restaurant Michelin-recommended'], amenities: ['Rooftop', 'Wi-Fi', 'Restaurant', 'Bar'], walkTo: '10 min to Marais', roomTypes: [] } },
  { id: 'hotel-praktik-paris', name: 'Hôtel Praktik Vinoteca', lat: 48.8539, lng: 2.3371, tier: 'mid', area: 'Saint-Germain', pricePerNight: 140, rating: '8.4', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Wine hotel concept', 'Natural wine bar on-site', 'Saint-Germain location'], amenities: ['Wine bar', 'Wi-Fi', 'Air conditioning'], walkTo: '5 min to Musée d\'Orsay', roomTypes: [] } },
  { id: 'peninsula-paris', name: 'The Peninsula Paris', lat: 48.8733, lng: 2.2992, tier: 'comfort', area: 'Kléber', pricePerNight: 1100, rating: '9.7', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', content: { highlights: ['Rooftop pool + restaurant', 'Haussmann architecture', 'Best service in Paris'], amenities: ['Pool', 'Spa', 'Wi-Fi', 'Gym', 'Restaurant', 'Rooftop'], walkTo: '8 min walk to Arc de Triomphe', roomTypes: [] } },

  // Kyoto
  { id: 'ritz-carlton-kyoto', name: 'The Ritz-Carlton Kyoto', lat: 35.0105, lng: 135.7726, tier: 'comfort', area: 'Nakagyo', pricePerNight: 700, rating: '9.5', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Kamogawa River views', 'Traditional kaiseki restaurant', 'Hinoki wood bathtubs'], amenities: ['Spa', 'Pool', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '10 min to Gion', roomTypes: [] } },
  { id: 'hotel-granvia-kyoto', name: 'Hotel Granvia Kyoto', lat: 35.0116, lng: 135.7581, tier: 'mid', area: 'Kyoto Station', pricePerNight: 160, rating: '8.6', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Inside Kyoto Station', 'Bullet train access', 'Multiple restaurants'], amenities: ['Wi-Fi', 'Gym', 'Restaurant', 'Bar'], walkTo: 'Direct access to Kyoto Station', roomTypes: [] } },
  { id: 'piece-hostel-sanjo', name: 'Piece Hostel Sanjo', lat: 35.0073, lng: 135.7654, tier: 'budget', area: 'Nakagyo', pricePerNight: 30, rating: '8.9', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Central location near Nishiki', 'Excellent common room', 'Bike rental'], amenities: ['Wi-Fi', 'Communal kitchen', 'Bike rental'], walkTo: '5 min to Nishiki Market', roomTypes: [] } },
  { id: 'mitsui-garden-kyoto', name: 'Mitsui Garden Hotel Kyoto Shinmachi Bettei', lat: 35.0097, lng: 135.7601, tier: 'mid', area: 'Shijo', pricePerNight: 130, rating: '8.7', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Traditional machiya design', 'Public bath (sento)', 'Central Shijo location'], amenities: ['Sento', 'Wi-Fi', 'Restaurant'], walkTo: '5 min to Nishiki Market', roomTypes: [] } },
  { id: 'kyoto-tower-annex', name: 'Kyoto Tower Hotel Annex', lat: 35.0100, lng: 135.7577, tier: 'budget', area: 'Kyoto Station', pricePerNight: 55, rating: '8.1', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Walk to Kyoto Station', 'Compact but clean', 'Good for JR Pass holders'], amenities: ['Wi-Fi', 'Air conditioning'], walkTo: '5 min to Kyoto Station', roomTypes: [] } },
  { id: 'hyatt-regency-kyoto', name: 'Hyatt Regency Kyoto', lat: 34.9949, lng: 135.7750, tier: 'comfort', area: 'Higashiyama', pricePerNight: 380, rating: '9.2', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Near Kiyomizu-dera', 'Outdoor garden', 'Touzan restaurant (Japanese)'], amenities: ['Spa', 'Pool', 'Wi-Fi', 'Gym', 'Restaurant'], walkTo: '10 min to Kiyomizu-dera', roomTypes: [] } },
  { id: 'gion-hatanaka', name: 'Gion Hatanaka', lat: 35.0040, lng: 135.7743, tier: 'comfort', area: 'Gion', pricePerNight: 500, rating: '9.4', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Authentic ryokan in Gion', 'Kaiseki dinner included', 'Geisha evening possible'], amenities: ['Wi-Fi', 'Full board available', 'Private onsen'], walkTo: '2 min to Gion main street', roomTypes: [] } },
  { id: 'daiwa-roynet-kyoto', name: 'Daiwa Roynet Hotel Kyoto-Hachijo', lat: 35.0113, lng: 135.7579, tier: 'mid', area: 'Kyoto Station', pricePerNight: 110, rating: '8.5', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Business hotel efficiency', 'Walk to Kyoto Station', 'Clean and modern'], amenities: ['Wi-Fi', 'Gym', 'Restaurant'], walkTo: '5 min to Kyoto Station', roomTypes: [] } },
  { id: 'piece-hostel-kyoto', name: 'Piece Hostel Kyoto', lat: 35.0090, lng: 135.7558, tier: 'budget', area: 'Gojo', pricePerNight: 25, rating: '8.7', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Second Piece property — more local feel', 'Quiet neighbourhood', 'Bike rental'], amenities: ['Wi-Fi', 'Communal kitchen', 'Bike rental'], walkTo: '15 min to Nishiki by bike', roomTypes: [] } },
  { id: 'hotel-kanra-kyoto', name: 'Hotel Kanra Kyoto', lat: 35.0005, lng: 135.7619, tier: 'mid', area: 'Shimogyo', pricePerNight: 145, rating: '8.9', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', content: { highlights: ['Modern machiya aesthetic', 'Tatami areas in rooms', 'In-house Japanese restaurant'], amenities: ['Wi-Fi', 'Restaurant', 'Tatami rooms'], walkTo: '10 min to Nishiki Market', roomTypes: [] } },

  // Berlin
  { id: 'hotel-adlon-berlin', name: 'Hotel Adlon Kempinski', lat: 52.5163, lng: 13.3812, tier: 'comfort', area: 'Mitte / Brandenburgo vartai', pricePerNight: 480, rating: '9.3', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', content: { highlights: ['Brandenburgo vartų prieigos', 'Istorinis prabangus viešbutis', 'Lorenz Adlon restoranas'], amenities: ['Spa', 'Pool', 'Wi-Fi', 'Gym', 'Restaurant', 'Bar'], walkTo: '2 min iki Brandenburgo vartų', roomTypes: [] } },
  { id: 'michelberger-berlin', name: 'Michelberger Hotel', lat: 52.5012, lng: 13.4493, tier: 'mid', area: 'Friedrichshain', pricePerNight: 130, rating: '8.9', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', content: { highlights: ['Kūrybinga hipsterio viešbučio atmosfera', 'Šalia East Side Gallery', 'Roko muzika gyvo garso'], amenities: ['Wi-Fi', 'Restaurant', 'Bar', 'Courtyard'], walkTo: '5 min iki East Side Gallery', roomTypes: [] } },
  { id: 'circus-hostel-berlin', name: 'Circus Hotel Berlin', lat: 52.5296, lng: 13.4048, tier: 'budget', area: 'Mitte', pricePerNight: 45, rating: '9.0', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', content: { highlights: ['Geriausias hostelių Berlyne', 'Naktinis baras su džiazo muzika', 'Šalia Rosenthaler Platz'], amenities: ['Wi-Fi', 'Bar', 'Communal kitchen', 'Tours'], walkTo: '10 min iki Muziejų salos', roomTypes: [] } },
  { id: 'soho-house-berlin', name: 'Soho House Berlin', lat: 52.5278, lng: 13.4103, tier: 'comfort', area: 'Mitte / Prenzlauer Berg', pricePerNight: 290, rating: '9.1', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', content: { highlights: ['Stogo baseinas', 'Privatus nario klubas + viešbutis', 'Kino salė'], amenities: ['Rooftop pool', 'Spa', 'Wi-Fi', 'Gym', 'Cinema'], walkTo: '10 min iki Brandenburgo vartų', roomTypes: [] } },
  { id: 'nhow-berlin', name: 'nhow Berlin', lat: 52.4993, lng: 13.4482, tier: 'mid', area: 'Friedrichshain', pricePerNight: 150, rating: '8.6', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', content: { highlights: ['Muzikos tematikos dizainas', 'Šprė upės vaizdas', 'Studija muzikantams'], amenities: ['Wi-Fi', 'Gym', 'Restaurant', 'Bar'], walkTo: '5 min iki East Side Gallery', roomTypes: [] } },

  // Amsterdam
  { id: 'waldorf-amsterdam', name: 'Waldorf Astoria Amsterdam', lat: 52.3661, lng: 4.8874, tier: 'comfort', area: 'Herengracht', pricePerNight: 650, rating: '9.6', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', content: { highlights: ['Six 17th-century canal houses', 'Michelin-starred Librije\'s Zusje', 'Direct canal access'], amenities: ['Spa', 'Wi-Fi', 'Gym', 'Restaurant', 'Bar'], walkTo: '5 min to Rijksmuseum', roomTypes: [] } },
  { id: 'pulitzer-amsterdam', name: 'Pulitzer Amsterdam', lat: 52.3729, lng: 4.8838, tier: 'comfort', area: 'Prinsengracht', pricePerNight: 380, rating: '9.2', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', content: { highlights: ['25 interconnected canal houses', 'Private garden', 'Boat tours from the hotel'], amenities: ['Restaurant', 'Bar', 'Wi-Fi', 'Terrace'], walkTo: '5 min to Anne Frank House', roomTypes: [] } },
  { id: 'conscious-hotel-vondelpark', name: 'Conscious Hotel Vondelpark', lat: 52.3612, lng: 4.8757, tier: 'mid', area: 'Vondelpark', pricePerNight: 145, rating: '8.8', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', content: { highlights: ['Sustainable design hotel', 'Directly on Vondelpark', 'Organic breakfast'], amenities: ['Wi-Fi', 'Restaurant', 'Bike rental'], walkTo: '5 min to Van Gogh Museum', roomTypes: [] } },
  { id: 'generator-amsterdam', name: 'Generator Amsterdam', lat: 52.3537, lng: 4.9021, tier: 'budget', area: 'De Pijp', pricePerNight: 35, rating: '8.6', img: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800', content: { highlights: ['Best hostel in Amsterdam', 'Rooftop bar with city views', 'Near Albert Cuypmarkt'], amenities: ['Wi-Fi', 'Bar', 'Communal kitchen', 'Tours'], walkTo: '10 min to Rijksmuseum', roomTypes: [] } },
  { id: 'v-hotel-amsterdam', name: 'V Hotel Amsterdam', lat: 52.3632, lng: 4.8886, tier: 'mid', area: 'Museum Quarter', pricePerNight: 180, rating: '8.9', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', content: { highlights: ['Steps from Museumplein', 'Modern design rooms', 'Excellent breakfast'], amenities: ['Wi-Fi', 'Restaurant', 'Bar'], walkTo: '2 min to Rijksmuseum', roomTypes: [] } },
];

// ─── Geo-matching helper ──────────────────────────────────────────────────────

async function recomputeAll(): Promise<void> {
  console.log('\nComputing geo-matches...');

  const destinationRows = await prisma.destination.findMany({
    select: { id: true, lat: true, lng: true, radiusKm: true },
  });

  const attractionRows = await prisma.attraction.findMany({
    select: { id: true, lat: true, lng: true },
  });
  const restaurantRows = await prisma.restaurant.findMany({
    select: { id: true, lat: true, lng: true },
  });
  const hotelRows = await prisma.hotel.findMany({
    select: { id: true, lat: true, lng: true },
  });

  for (const dest of destinationRows) {
    if (dest.lat == null || dest.lng == null) continue;

    const matchingAttractions = attractionRows.filter(
      (a) => haversineDistanceKm(dest.lat!, dest.lng!, a.lat, a.lng) <= dest.radiusKm,
    );
    const matchingRestaurants = restaurantRows.filter(
      (r) => haversineDistanceKm(dest.lat!, dest.lng!, r.lat, r.lng) <= dest.radiusKm,
    );
    const matchingHotels = hotelRows.filter(
      (h) => haversineDistanceKm(dest.lat!, dest.lng!, h.lat, h.lng) <= dest.radiusKm,
    );

    await prisma.destinationAttraction.deleteMany({ where: { destinationId: dest.id } });
    await prisma.destinationRestaurant.deleteMany({ where: { destinationId: dest.id } });
    await prisma.destinationHotel.deleteMany({ where: { destinationId: dest.id } });

    if (matchingAttractions.length > 0) {
      await prisma.destinationAttraction.createMany({
        data: matchingAttractions.map((a) => ({ destinationId: dest.id, attractionId: a.id })),
        skipDuplicates: true,
      });
    }
    if (matchingRestaurants.length > 0) {
      await prisma.destinationRestaurant.createMany({
        data: matchingRestaurants.map((r) => ({ destinationId: dest.id, restaurantId: r.id })),
        skipDuplicates: true,
      });
    }
    if (matchingHotels.length > 0) {
      await prisma.destinationHotel.createMany({
        data: matchingHotels.map((h) => ({ destinationId: dest.id, hotelId: h.id })),
        skipDuplicates: true,
      });
    }

    console.log(
      `  ✓ ${dest.id}: ${matchingAttractions.length} attractions, ` +
      `${matchingRestaurants.length} restaurants, ${matchingHotels.length} hotels`,
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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

  console.log('\nSeeding attractions...');
  for (const attraction of attractions) {
    await prisma.attraction.upsert({
      where: { id: attraction.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: attraction as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: attraction as any,
    });
    console.log(`  ✓ ${attraction.name}`);
  }

  console.log('\nSeeding restaurants...');
  for (const restaurant of restaurants) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: restaurant as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: restaurant as any,
    });
    console.log(`  ✓ ${restaurant.name}`);
  }

  console.log('\nSeeding hotels...');
  for (const hotel of hotels) {
    await prisma.hotel.upsert({
      where: { id: hotel.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: hotel as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: hotel as any,
    });
    console.log(`  ✓ ${hotel.name}`);
  }

  await recomputeAll();

  // ── Experiences ───────────────────────────────────────────────────────────────
  const experiences = [
    {
      id: 'bunkers-del-carmel-barselona',
      destinationId: 'barcelona',
      title: 'Bunkers del Carmel saulėlydis',
      subtitle: 'Geriausia Barselonos panorama su vietiniais',
      category: 'Vaizdai',
      heroImgUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80',
      price: 'Nemokamai',
      duration: '2–3 val.',
      tags: ['Romantika', 'Vakaras', 'Panorama'],
      content: {
        description: 'Bunkers del Carmel yra buvusi priešlėktuvinės gynybos zona, siūlanti geriausią 360° Barselonos panoramą.',
        highlights: ['360° panorama', 'Populiari tarp vietinių', 'Geriausia saulėlydžio vieta'],
        insiderTip: 'Ateikite likus 1 valandai iki saulėlydžio ir atsineškite vyno bei snackų.',
        bestTime: 'Vakaras (18:00–21:00)',
      },
    },
    {
      id: 'sagrada-familia-early',
      destinationId: 'barcelona',
      title: 'Sagrada Família 9:00 ryte',
      subtitle: 'Be eilių, be turistų minios',
      category: 'Architektūra',
      heroImgUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
      price: '€26–€36',
      duration: '2 val.',
      tags: ['Architektūra', 'Rytas', 'Kultūra'],
      content: {
        description: 'Gaudí šedevras — viena lankomiausiųjų turistinių vietų pasaulyje. Lankykitės anksti ryte, kad išvengtumėte eilių.',
        highlights: ['Ankstyvojo lankymo privalumas', 'Gaudí genialumas', 'Vitražai ryto šviesoje'],
        insiderTip: 'Rezervuokite bilietą internetu iš anksto. Pasirinkite 9:00 laiko tarpsnį.',
        bestTime: 'Rytas (9:00–11:00)',
      },
    },
    {
      id: 'sintra-day-trip',
      destinationId: 'lisbon',
      title: 'Sintra dieninė ekskursija',
      subtitle: '8:08 traukinys — pilys be eilių',
      category: 'Gamta',
      heroImgUrl: 'https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=800&q=80',
      price: '€5 traukinys + €15–€20 bilietai',
      duration: 'Visa diena',
      tags: ['Pilis', 'Gamta', 'Dieninė ekskursija'],
      content: {
        description: 'Sintra — pasakiška miestelis, pilna romantiškų pilių ir sodų, vos 40 minučių nuo Lisabonos.',
        highlights: ['Pena pilis', 'Moorų pilis', 'Quinta da Regaleira'],
        insiderTip: 'Sėskite į 8:08 traukinį iš Rossio stoties. Grįžkite 17:00 prieš turistų antplūdį.',
        bestTime: 'Rytas (8:00–12:00)',
      },
    },
    {
      id: 'marrakech-medina-walk',
      destinationId: 'marrakech',
      title: 'Medinų klajojimas su vietiniu',
      subtitle: 'Slaptieji Marakešo turgai',
      category: 'Kultūra',
      heroImgUrl: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80',
      price: '€20–€30',
      duration: '3–4 val.',
      tags: ['Kultūra', 'Turgus', 'Autentiška'],
      content: {
        description: 'Pasivaikščiokite po senovines Marakešo medinas su vietiniu gidu, kuris žino visus slaptus praėjimus.',
        highlights: ['Slaptieji turgai', 'Tradiciniai amatai', 'Autentiška virtuvė'],
        insiderTip: 'Prašykite gido nuvesti prie neturistiniu restoranų. Derėkitės maloniai.',
        bestTime: 'Rytas (9:00–13:00)',
      },
    },
    {
      id: 'paris-morning-market',
      destinationId: 'paris',
      title: 'Paryžiaus ryto turgus',
      subtitle: 'Rue Mouffetard su vietiniais',
      category: 'Maistas',
      heroImgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      price: 'Nemokamai (produktai pagal poreikį)',
      duration: '1–2 val.',
      tags: ['Maistas', 'Rytas', 'Vietiniai'],
      content: {
        description: 'Rue Mouffetard — vienas seniausių Paryžiaus turgų, kur vietiniai perka šviežius produktus kiekvieną rytą.',
        highlights: ['Šviežios kepyklos', 'Vietiniai sūriai', 'Paryžietiškas rytinis gyvenimas'],
        insiderTip: 'Ateikite 8:00–10:00. Pirkite croissant iš Boulangerie Eric Kayser.',
        bestTime: 'Rytas (8:00–10:00)',
      },
    },
  ];

  for (const experience of experiences) {
    await prisma.experience.upsert({
      where: { id: experience.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: experience as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: experience as any,
    });
  }

  // ── Testimonials ──────────────────────────────────────────────────────────────
  const testimonials = [
    {
      id: 'lina-barcelona',
      text: '"Barselona be turistų minios yra įmanoma! Mūsų Gaudí maršrutas prasidėjo 8:00 ryte — Sagrada Família beveik tuščia. Sutaupėme ~€80 lyginant su standartiniais turais."',
      author: 'Lina M.',
      city: 'Vilnius',
      initials: 'LM',
      colorHex: '#E8734A',
      destinationName: 'Barselona',
      tripDate: '2025 m. liepa',
      highlight: 'Sagrada Família be eilių',
      savedAmount: '~€80',
    },
    {
      id: 'tomas-marrakech',
      text: '"Marakešas be streso — tai įmanoma su Veygo. Riad viešbutis 10x geresnis nei tas, kurį radau Booking, ir pigiau. Visi slaptieji turgai, kuriuos rekomendavo, buvo tikri."',
      author: 'Tomas K.',
      city: 'Kaunas',
      initials: 'TK',
      colorHex: '#1A5C57',
      destinationName: 'Marakešas',
      tripDate: '2025 m. lapkritis',
      highlight: 'Riad viešbutis 10x geresnis nei Booking',
      savedAmount: '~€100',
    },
    {
      id: 'giedre-lisbon',
      text: '"28 tramvajus 8:00 ryte — buvome vieni. Sintra pilys be eilių. Pastéis de Belém tiesiog iš kepyklos. Viskas buvo suplanuota iki minutės."',
      author: 'Giedrė S.',
      city: 'Klaipėda',
      initials: 'GS',
      colorHex: '#3B82F6',
      destinationName: 'Lisabona',
      tripDate: '2025 m. spalis',
      highlight: 'Sintra pilys be eilių',
      savedAmount: null,
    },
    {
      id: 'jonas-paris',
      text: '"Paryžius be eilių prie Eifelio bokšto — stebuklas. Slaptų kavinukų sąrašas buvo vertingesnis nei bet kokia kelionių knyga. Rekomenduosiu visiems draugams."',
      author: 'Jonas M.',
      city: 'Šiauliai',
      initials: 'JM',
      colorHex: '#D97706',
      destinationName: 'Paryžius',
      tripDate: '2025 m. gegužė',
      highlight: 'Eifelio bokštas be eilių',
      savedAmount: '~€150',
    },
    {
      id: 'ruta-rome',
      text: '"Roma be turistų minios yra įmanoma! Vatikano muziejus 8:00 ryte — beveik tušti koridoriai. Graikų restoranas Trastevere — vertas kiekvieno euro."',
      author: 'Rūta P.',
      city: 'Panevėžys',
      initials: 'RP',
      colorHex: '#059669',
      destinationName: 'Roma',
      tripDate: '2025 m. kovas',
      highlight: 'Vatikanas beveik be eilių',
      savedAmount: '~€200',
    },
    {
      id: 'andrius-kyoto',
      text: '"Kioto sakurų sezonu — ir nė vieno traukinio vėlavimo. Vietinių rekomenduoti ryžių laukai Arashiyama vietoj bambukyno — geras patarimas, sutaupė 2 valandas eilėje."',
      author: 'Andrius B.',
      city: 'Vilnius',
      initials: 'AB',
      colorHex: '#C2755C',
      destinationName: 'Kijotas',
      tripDate: '2025 m. balandis',
      highlight: 'Arashiyama be eilių',
      savedAmount: null,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: testimonial as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: testimonial as any,
    });
  }

  // ── Ready Plans ───────────────────────────────────────────────────────────────
  const itin1 = await prisma.itinerary.upsert({
    where: { id: 'itin-vasara-barselona' },
    update: {},
    create: {
      id: 'itin-vasara-barselona',
      title: 'Vasaros savaitgalis Barselonoje',
      days: [
        { day: 1, activities: ['Gaudí maršrutas: Casa Batlló ir La Pedrera', 'Vakariena El Born kvartale'] },
        { day: 2, activities: ['Sagrada Família (iš anksto rezervuoti bilietai)', 'Park Güell saulėlydis'] },
        { day: 3, activities: ['Barceloneta paplūdimys', 'Tapasai La Boqueria turguje'] },
        { day: 4, activities: ['Montjuïc pilis', 'Skrydis namo'] },
      ],
      costs: { flights: 180, hotel: 320, food: 160, transport: 40, activities: 80 },
    },
  });

  await prisma.readyPlan.upsert({
    where: { id: 'vasara-barselona' },
    update: {},
    create: {
      id: 'vasara-barselona',
      itineraryId: itin1.id,
      title: 'Vasaros savaitgalis Barselonoje',
      subtitle: '4 dienos · Liepa 3–7, 2026',
      price: 999,
      imgUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      badge: 'Populiarus',
      tags: ['Poroms', 'Vasara', 'Paplūdimys'],
      isPublished: true,
    },
  });

  const itin2 = await prisma.itinerary.upsert({
    where: { id: 'itin-naujieji-lisabona' },
    update: {},
    create: {
      id: 'itin-naujieji-lisabona',
      title: 'Naujieji metai Lisabonoje',
      days: [
        { day: 1, activities: ['Alfama rajonas ir São Jorge pilis', 'Fado vakaras Mouraria'] },
        { day: 2, activities: ['Sintra dieninė ekskursija (8:08 traukinys)', 'Grįžimas saulėlydžiui'] },
        { day: 3, activities: ['Belém rajonas: Jerónimos, pastéis de Belém', 'LX Factory savaitgalio turgus'] },
        { day: 4, activities: ['Naujametinė šventė Praça do Comércio', 'Fejerverkai prie upės'] },
        { day: 5, activities: ['Príncipe Real rajonas', 'Skrydis namo'] },
      ],
      costs: { flights: 210, hotel: 400, food: 200, transport: 60, activities: 90 },
    },
  });

  await prisma.readyPlan.upsert({
    where: { id: 'naujieji-lisabona' },
    update: {},
    create: {
      id: 'naujieji-lisabona',
      itineraryId: itin2.id,
      title: 'Naujieji metai Lisabonoje',
      subtitle: '5 dienos · Gru 29 – Sau 3, 2027',
      price: 1290,
      imgUrl: 'https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=600&q=80',
      badge: 'Sezoninis',
      tags: ['Poroms', 'Naujieji', 'Kultūra'],
      isPublished: true,
    },
  });

  const itin3 = await prisma.itinerary.upsert({
    where: { id: 'itin-paris-rome' },
    update: {},
    create: {
      id: 'itin-paris-rome',
      title: 'Paryžius + Roma 7 dienoms',
      days: [],
      costs: { flights: 350, hotel: 700, food: 420, transport: 130, activities: 200 },
    },
  });

  const seg1exists = await prisma.itinerarySegment.findFirst({ where: { itineraryId: itin3.id, order: 1 } });
  if (!seg1exists) {
    await prisma.itinerarySegment.create({
      data: {
        itineraryId: itin3.id,
        destinationId: 'paris',
        order: 1,
        days: [
          { day: 1, activities: ['Eiffelio bokštas be eilių (9:00)', 'Le Marais rajonas'] },
          { day: 2, activities: ['Luvras (trečiadieniais iki 21:45)', 'Montmartre saulėlydis'] },
          { day: 3, activities: ['Versalis (anksti ryte)', 'Skrydis į Romą vakare'] },
        ],
        costs: { flights: 150, hotel: 360, food: 210, transport: 60, activities: 100 },
      },
    });
  }

  const seg2exists = await prisma.itinerarySegment.findFirst({ where: { itineraryId: itin3.id, order: 2 } });
  if (!seg2exists) {
    await prisma.itinerarySegment.create({
      data: {
        itineraryId: itin3.id,
        destinationId: 'rome',
        order: 2,
        days: [
          { day: 4, activities: ['Vatikano muziejus 8:00 (be eilių)', 'Šv. Petro bazilika'] },
          { day: 5, activities: ['Koliziejus ir Romos forumas', 'Trastevere vakaras'] },
          { day: 6, activities: ['Borghese galerija', 'Trevi fontanas auštant'] },
          { day: 7, activities: ['Laisvos pusryčiai Campo de\' Fiori', 'Skrydis namo'] },
        ],
        costs: { flights: 200, hotel: 340, food: 210, transport: 70, activities: 100 },
      },
    });
  }

  await prisma.readyPlan.upsert({
    where: { id: 'paris-roma-7d' },
    update: {},
    create: {
      id: 'paris-roma-7d',
      itineraryId: itin3.id,
      title: 'Paryžius + Roma 7 dienoms',
      subtitle: '7 dienų Europos klasika',
      price: 1799,
      imgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
      badge: 'Geriausias pasirinkimas',
      tags: ['Poroms', 'Kultūra', 'Europa'],
      isPublished: true,
    },
  });

  console.log('✅ Experiences, Testimonials, and ReadyPlans seeded');

  console.log(`
Done.
  Destinations:  ${destinations.length}
  Attractions:   ${attractions.length}
  Restaurants:   ${restaurants.length}
  Hotels:        ${hotels.length}
  Experiences:   ${experiences.length}
  Testimonials:  ${testimonials.length}
`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
