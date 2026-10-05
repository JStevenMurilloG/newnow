export interface Region {
  id: string;
  name: string;
  /** [lon, lat] hacia donde mira la cámara */
  center: [number, number];
  distance: number;
  /** consulta para /everything */
  query: string;
  countries: string[];
}

const list = (codes: string) => codes.split(' ');

export const REGIONS: Region[] = [
  {
    id: 'north-america',
    name: 'Norteamérica',
    center: [-100, 44],
    distance: 2.9,
    query: '"Estados Unidos" OR "United States" OR Canadá OR Canada',
    countries: list('us ca gl'),
  },
  {
    id: 'latin-america',
    name: 'Latinoamérica',
    center: [-66, -12],
    distance: 3.05,
    query: 'Latinoamérica OR "América Latina" OR "Latin America" OR México OR Brasil OR Argentina OR Colombia',
    countries: list('mx gt bz sv hn ni cr pa cu ht do jm pr tt bs co ve gy sr ec pe bo br py uy ar cl fk'),
  },
  {
    id: 'europe',
    name: 'Europa',
    center: [12, 50],
    distance: 2.6,
    query: 'Europa OR Europe OR "Unión Europea" OR "European Union"',
    countries: list(
      'gb ie fr es pt de it nl be lu ch at dk no se fi is pl cz sk hu ro bg gr al mk rs me ba hr si ee lv lt by ua md ru cy',
    ),
  },
  {
    id: 'middle-east',
    name: 'Oriente Medio',
    center: [45, 28],
    distance: 2.5,
    query: '"Oriente Medio" OR "Oriente Próximo" OR "Middle East"',
    countries: list('tr sy lb il ps jo iq ir sa ye om ae qa kw'),
  },
  {
    id: 'africa',
    name: 'África',
    center: [20, 3],
    distance: 3.05,
    query: 'África OR Africa',
    countries: list(
      'ma dz tn ly eg eh mr ml ne td sd ss er dj et so ke ug rw bi tz sn gm gw gn sl lr ci gh tg bj bf ng cm cf gq ga cg cd ao zm mw mz zw bw na za ls sz mg',
    ),
  },
  {
    id: 'asia',
    name: 'Asia',
    center: [95, 32],
    distance: 3.1,
    query: 'Asia OR China OR India OR Japón OR Japan',
    countries: list(
      'kz uz tm kg tj af pk in np bt bd lk mm th la kh vn my id ph bn tl cn mn kp kr jp tw ge am az',
    ),
  },
  {
    id: 'oceania',
    name: 'Oceanía',
    center: [140, -25],
    distance: 2.9,
    query: 'Oceanía OR Oceania OR Australia OR "Nueva Zelanda" OR "New Zealand"',
    countries: list('au nz pg fj sb vu nc'),
  },
];

export const regionById = (id: string | undefined) => REGIONS.find((r) => r.id === id);
