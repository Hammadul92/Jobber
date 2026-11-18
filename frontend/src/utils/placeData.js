// Place lookups for Quick Add: Canadian postal codes and US ZIP codes to a
// province/state, and the larger cities of Canada and the US. Kept free of
// imports so it can be unit tested in node.

// First letter of a Canadian postal code -> province. X is split below.
const CA_POSTAL_PROVINCE = {
  A: "NL", B: "NS", C: "PE", E: "NB", G: "QC", H: "QC", J: "QC",
  K: "ON", L: "ON", M: "ON", N: "ON", P: "ON", R: "MB", S: "SK", T: "AB", V: "BC", Y: "YT",
};

export function provinceFromPostal(postal) {
  const code = String(postal || "").toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(code)) return null;
  // X0A, X0B and X0C are Nunavut; the rest of X is the Northwest Territories.
  if (code[0] === "X") return /^X0[ABC]/.test(code) ? "NU" : "NT";
  return CA_POSTAL_PROVINCE[code[0]] || null;
}

// First three ZIP digits -> state, as inclusive [from, to, state] ranges.
const US_ZIP3 = [
  [5, 5, "NY"], [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"], [50, 54, "VT"],
  [55, 55, "MA"], [56, 59, "VT"], [60, 69, "CT"], [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"],
  [197, 199, "DE"], [200, 200, "DC"], [201, 201, "VA"], [202, 205, "DC"], [206, 219, "MD"],
  [220, 246, "VA"], [247, 268, "WV"], [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"],
  [320, 339, "FL"], [341, 349, "FL"], [350, 369, "AL"], [370, 385, "TN"], [386, 397, "MS"],
  [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"], [460, 479, "IN"], [480, 499, "MI"],
  [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [569, 569, "DC"], [570, 577, "SD"],
  [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"], [660, 679, "KS"],
  [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"], [730, 732, "OK"], [733, 733, "TX"],
  [734, 749, "OK"], [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"], [832, 838, "ID"],
  [840, 847, "UT"], [850, 865, "AZ"], [870, 884, "NM"], [885, 885, "TX"], [889, 898, "NV"],
  [900, 961, "CA"], [967, 968, "HI"], [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

export function stateFromZip(zip) {
  const match = String(zip || "").match(/^(\d{3})\d{2}(?:-\d{4})?$/);
  if (!match) return null;
  const prefix = Number(match[1]);
  const range = US_ZIP3.find(([from, to]) => prefix >= from && prefix <= to);
  return range ? range[2] : null;
}

// Larger cities, Canada first so an ambiguous name with no other clue
// (London, Vancouver, Richmond, Kingston...) resolves to the Canadian one.
const CA_CITIES = {
  AB: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie",
    "Airdrie", "Spruce Grove", "Leduc", "Okotoks", "Cochrane", "Fort McMurray", "Sherwood Park",
    "Canmore", "Chestermere", "Camrose", "Lloydminster", "Beaumont", "Fort Saskatchewan", "Stony Plain",
    "Banff", "Brooks", "Cold Lake", "Wetaskiwin", "Strathmore", "High River", "Sylvan Lake", "Lacombe",
    "Morinville", "Whitecourt", "Olds", "Innisfail", "Blackfalds", "Hinton", "Drumheller", "Taber"],
  BC: ["Vancouver", "Surrey", "Burnaby", "Richmond", "Kelowna", "Victoria", "Abbotsford", "Coquitlam",
    "Langley", "Saanich", "Delta", "Kamloops", "Nanaimo", "Chilliwack", "Prince George", "North Vancouver",
    "West Vancouver", "Maple Ridge", "New Westminster", "Port Coquitlam", "Vernon", "Penticton", "Squamish",
    "Mission", "Campbell River", "Courtenay", "White Rock", "Langford", "Port Moody", "Pitt Meadows",
    "West Kelowna", "Fort St. John", "Cranbrook", "Salmon Arm", "Duncan", "Parksville", "Whistler",
    "Nelson", "Terrace", "Prince Rupert", "Dawson Creek", "Williams Lake", "Powell River", "Colwood",
    "Esquimalt", "Oak Bay", "Sidney", "Sooke", "Comox", "Summerland", "Peachland", "Lake Country"],
  SK: ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current", "Yorkton", "North Battleford",
    "Estevan", "Weyburn", "Warman", "Martensville", "Lloydminster", "Humboldt", "Melfort"],
  MB: ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie", "Winkler", "Selkirk",
    "Morden", "Dauphin", "The Pas", "Flin Flon"],
  ON: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan",
    "Kitchener", "Windsor", "Richmond Hill", "Oakville", "Burlington", "Oshawa", "Barrie", "Guelph",
    "Cambridge", "Waterloo", "Kingston", "Whitby", "Sudbury", "Greater Sudbury", "Thunder Bay",
    "St. Catharines", "Niagara Falls", "Pickering", "Ajax", "Milton", "Newmarket", "Peterborough",
    "Sault Ste. Marie", "Brantford", "Clarington", "Sarnia", "Welland", "North Bay", "Belleville",
    "Cornwall", "Aurora", "Halton Hills", "Caledon", "Georgina", "Innisfil", "Bradford", "Orillia",
    "Stouffville", "Woodstock", "Stratford", "Timmins", "Orangeville", "Leamington", "Chatham",
    "Chatham-Kent", "Kawartha Lakes", "Norfolk", "Grimsby", "Lincoln", "Fort Erie", "St. Thomas",
    "Owen Sound", "Collingwood", "Brockville", "Etobicoke", "Scarborough", "North York", "East York",
    "Nepean", "Kanata", "Orleans", "Gloucester", "Stoney Creek", "Ancaster", "Dundas"],
  QC: ["Montreal", "Montréal", "Quebec City", "Québec", "Laval", "Gatineau", "Longueuil", "Sherbrooke",
    "Saguenay", "Lévis", "Levis", "Trois-Rivières", "Trois-Rivieres", "Terrebonne", "Saint-Jean-sur-Richelieu",
    "Repentigny", "Brossard", "Drummondville", "Saint-Jérôme", "Granby", "Blainville", "Saint-Hyacinthe",
    "Shawinigan", "Dollard-des-Ormeaux", "Rimouski", "Châteauguay", "Mirabel", "Victoriaville",
    "Rouyn-Noranda", "Pointe-Claire", "Boucherville", "Mascouche", "Vaudreuil-Dorion", "Kirkland",
    "Beaconsfield", "Westmount", "Mont-Royal", "Chicoutimi", "Sept-Îles", "Val-d'Or"],
  NS: ["Halifax", "Dartmouth", "Sydney", "Truro", "New Glasgow", "Glace Bay", "Kentville", "Amherst",
    "Bridgewater", "Yarmouth", "Bedford", "Lower Sackville", "Wolfville", "Antigonish"],
  NB: ["Moncton", "Saint John", "Fredericton", "Dieppe", "Riverview", "Miramichi", "Edmundston",
    "Bathurst", "Quispamsis", "Rothesay", "Oromocto", "Campbellton"],
  NL: ["St. John's", "Mount Pearl", "Corner Brook", "Conception Bay South", "Paradise", "Grand Falls-Windsor",
    "Gander", "Happy Valley-Goose Bay", "Torbay", "Labrador City"],
  PE: ["Charlottetown", "Summerside", "Stratford", "Cornwall"],
  YT: ["Whitehorse", "Dawson City"],
  NT: ["Yellowknife", "Hay River", "Inuvik"],
  NU: ["Iqaluit", "Rankin Inlet"],
};

const US_CITIES = {
  AL: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa", "Hoover", "Auburn", "Dothan"],
  AK: ["Anchorage", "Fairbanks", "Juneau"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria",
    "Surprise", "Yuma", "Avondale", "Goodyear", "Flagstaff", "Buckeye", "Casa Grande", "Prescott"],
  AR: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "Rogers", "Conway", "Bentonville"],
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach",
    "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista",
    "Fremont", "San Bernardino", "Modesto", "Fontana", "Moreno Valley", "Santa Clarita", "Glendale",
    "Huntington Beach", "Garden Grove", "Oceanside", "Rancho Cucamonga", "Santa Rosa", "Ontario",
    "Elk Grove", "Corona", "Lancaster", "Palmdale", "Salinas", "Hayward", "Pomona", "Escondido",
    "Sunnyvale", "Torrance", "Pasadena", "Orange", "Fullerton", "Roseville", "Visalia", "Concord",
    "Thousand Oaks", "Santa Clara", "Simi Valley", "Victorville", "Vallejo", "Berkeley", "El Monte",
    "Downey", "Costa Mesa", "Inglewood", "Carlsbad", "San Buenaventura", "Ventura", "Fairfield",
    "West Covina", "Murrieta", "Richmond", "Norwalk", "Antioch", "Temecula", "Burbank", "Daly City",
    "Rialto", "Santa Maria", "El Cajon", "San Mateo", "Clovis", "Compton", "Jurupa Valley", "Vista",
    "South Gate", "Mission Viejo", "Vacaville", "Carson", "Hesperia", "Santa Monica", "Redding",
    "Santa Barbara", "Chico", "Newport Beach", "San Leandro", "Hawthorne", "Citrus Heights", "Livermore",
    "Tracy", "Alhambra", "Whittier", "Lakewood", "Chino", "Mountain View", "Palo Alto", "Redwood City",
    "Menlo Park", "Cupertino", "San Rafael", "Napa", "Davis", "Monterey", "Santa Cruz", "Palm Springs"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada",
    "Westminster", "Pueblo", "Centennial", "Boulder", "Greeley", "Longmont", "Loveland", "Broomfield",
    "Castle Rock", "Littleton", "Parker", "Grand Junction", "Brighton", "Commerce City"],
  CT: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain",
    "Greenwich", "Fairfield", "West Hartford", "Milford"],
  DE: ["Wilmington", "Dover", "Newark"],
  DC: ["Washington"],
  FL: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Port St. Lucie",
    "Tallahassee", "Cape Coral", "Fort Lauderdale", "Pembroke Pines", "Hollywood", "Miramar",
    "Gainesville", "Coral Springs", "Lehigh Acres", "Clearwater", "Palm Bay", "West Palm Beach",
    "Pompano Beach", "Lakeland", "Davie", "Miami Gardens", "Boca Raton", "Sunrise", "Deltona",
    "Plantation", "Palm Coast", "Fort Myers", "Deerfield Beach", "Melbourne", "Boynton Beach",
    "Largo", "Kissimmee", "Homestead", "Daytona Beach", "Naples", "Sarasota", "Pensacola", "Ocala",
    "Delray Beach", "Jupiter", "Weston", "Sanford", "Bradenton", "Miami Beach", "Doral", "Key West"],
  GA: ["Atlanta", "Columbus", "Augusta", "Macon", "Savannah", "Athens", "Sandy Springs", "South Fulton",
    "Roswell", "Johns Creek", "Warner Robins", "Alpharetta", "Marietta", "Valdosta", "Smyrna", "Dunwoody"],
  HI: ["Honolulu", "Hilo", "Kailua", "Kapolei", "Pearl City"],
  ID: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Caldwell", "Pocatello", "Coeur d'Alene", "Twin Falls"],
  IL: ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Springfield", "Elgin", "Peoria",
    "Champaign", "Waukegan", "Cicero", "Bloomington", "Arlington Heights", "Evanston", "Schaumburg",
    "Bolingbrook", "Palatine", "Skokie", "Des Plaines", "Orland Park", "Oak Lawn", "Berwyn",
    "Wheaton", "Downers Grove", "Oak Park", "Decatur"],
  IN: ["Indianapolis", "Fort Wayne", "Evansville", "Carmel", "South Bend", "Fishers", "Bloomington",
    "Hammond", "Gary", "Lafayette", "Muncie", "Noblesville", "Terre Haute", "Greenwood", "Kokomo"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Ankeny", "West Des Moines",
    "Ames", "Waterloo", "Council Bluffs", "Dubuque"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Lenexa",
    "Manhattan", "Salina"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Richmond", "Georgetown",
    "Florence", "Frankfort"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City",
    "Monroe", "Metairie"],
  ME: ["Portland", "Lewiston", "Bangor", "South Portland", "Augusta"],
  MD: ["Baltimore", "Columbia", "Germantown", "Silver Spring", "Frederick", "Rockville", "Gaithersburg",
    "Bethesda", "Bowie", "Annapolis", "Ellicott City", "Towson", "Hagerstown"],
  MA: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "Quincy", "Lynn",
    "New Bedford", "Fall River", "Newton", "Somerville", "Lawrence", "Framingham", "Waltham", "Haverhill",
    "Malden", "Medford", "Taunton", "Chicopee", "Weymouth", "Revere", "Peabody", "Methuen", "Plymouth"],
  MI: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Dearborn",
    "Clinton Township", "Canton", "Livonia", "Troy", "Westland", "Farmington Hills", "Flint",
    "Wyoming", "Southfield", "Rochester Hills", "Kalamazoo", "Novi", "Taylor", "Pontiac", "Royal Oak",
    "Battle Creek", "Saginaw", "Kentwood", "East Lansing", "Traverse City"],
  MN: ["Minneapolis", "St. Paul", "Saint Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park",
    "Plymouth", "Woodbury", "Maple Grove", "St. Cloud", "Eagan", "Eden Prairie", "Coon Rapids",
    "Burnsville", "Blaine", "Lakeville", "Minnetonka", "Apple Valley", "Edina"],
  MS: ["Jackson", "Gulfport", "Southaven", "Biloxi", "Hattiesburg", "Olive Branch", "Tupelo", "Meridian"],
  MO: ["Kansas City", "St. Louis", "Saint Louis", "Springfield", "Columbia", "Independence",
    "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "Blue Springs", "Joplin", "Chesterfield",
    "Jefferson City", "Cape Girardeau"],
  MT: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
  NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Paradise",
    "Enterprise", "Spring Valley", "Sunrise Manor"],
  NH: ["Manchester", "Nashua", "Concord", "Dover", "Rochester", "Portsmouth"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Lakewood", "Edison", "Woodbridge", "Toms River",
    "Hamilton", "Trenton", "Clifton", "Camden", "Brick", "Cherry Hill", "Passaic", "Union City",
    "Bayonne", "East Orange", "Vineland", "New Brunswick", "Hoboken", "Princeton", "Morristown"],
  NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington"],
  NY: ["New York", "New York City", "Brooklyn", "Queens", "Bronx", "Manhattan", "Staten Island",
    "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon",
    "Schenectady", "Utica", "White Plains", "Hempstead", "Troy", "Niagara Falls", "Binghamton",
    "Ithaca", "Long Island", "Saratoga Springs"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary",
    "Wilmington", "High Point", "Concord", "Asheville", "Greenville", "Gastonia", "Jacksonville",
    "Chapel Hill", "Huntersville", "Apex", "Wake Forest", "Kannapolis", "Mooresville"],
  ND: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown",
    "Lorain", "Hamilton", "Springfield", "Kettering", "Elyria", "Lakewood", "Cuyahoga Falls",
    "Dublin", "Middletown", "Mentor", "Beavercreek", "Strongsville", "Westerville", "Mason"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond", "Lawton", "Moore", "Midwest City",
    "Enid", "Stillwater"],
  OR: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Beaverton", "Bend", "Medford",
    "Springfield", "Corvallis", "Albany", "Tigard", "Lake Oswego"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie", "Scranton", "Bethlehem", "Lancaster",
    "Harrisburg", "Altoona", "York", "State College", "Wilkes-Barre", "Chester", "Norristown"],
  RI: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Newport"],
  SC: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville",
    "Summerville", "Goose Creek", "Sumter", "Hilton Head Island", "Spartanburg", "Florence", "Myrtle Beach"],
  SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin",
    "Jackson", "Johnson City", "Bartlett", "Hendersonville", "Kingsport", "Collierville", "Smyrna"],
  TX: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi",
    "Plano", "Laredo", "Lubbock", "Irving", "Garland", "Frisco", "McKinney", "Amarillo", "Grand Prairie",
    "Brownsville", "Killeen", "Pasadena", "Mesquite", "McAllen", "Denton", "Waco", "Carrollton",
    "Midland", "Abilene", "Round Rock", "Odessa", "Pearland", "Richardson", "College Station",
    "League City", "Beaumont", "Lewisville", "Allen", "Tyler", "Sugar Land", "Wichita Falls",
    "Edinburg", "Conroe", "San Angelo", "New Braunfels", "Bryan", "Pharr", "Temple", "Flower Mound",
    "Georgetown", "Cedar Park", "Mansfield", "Katy", "The Woodlands", "Spring", "Cypress", "Humble",
    "Pflugerville", "Kyle", "San Marcos", "Leander", "Euless", "Grapevine", "Keller", "Southlake"],
  UT: ["Salt Lake City", "West Valley City", "West Jordan", "Provo", "Orem", "Sandy", "St. George",
    "Ogden", "Layton", "South Jordan", "Lehi", "Millcreek", "Taylorsville", "Logan", "Murray", "Draper"],
  VT: ["Burlington", "South Burlington", "Rutland", "Montpelier"],
  VA: ["Virginia Beach", "Chesapeake", "Norfolk", "Arlington", "Richmond", "Newport News", "Alexandria",
    "Hampton", "Roanoke", "Portsmouth", "Suffolk", "Lynchburg", "Harrisonburg", "Leesburg",
    "Charlottesville", "Blacksburg", "Fairfax", "Reston", "Manassas", "Fredericksburg", "Ashburn"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Spokane Valley",
    "Federal Way", "Yakima", "Kirkland", "Bellingham", "Auburn", "Kennewick", "Pasco", "Marysville",
    "Redmond", "Sammamish", "Lakewood", "Richland", "Shoreline", "Olympia", "Lacey", "Burien",
    "Bothell", "Edmonds", "Puyallup", "Issaquah", "Lynnwood"],
  WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Eau Claire",
    "Oshkosh", "Janesville", "West Allis", "La Crosse", "Sheboygan", "Wauwatosa"],
  WY: ["Cheyenne", "Casper", "Laramie", "Gillette", "Jackson"],
};

// Names that are also everyday words or common first names: matched only
// when written with a capital letter, and never inside the client's name.
const WORD_LIKE = new Set([
  "Mobile", "Surprise", "Orange", "Independence", "Enterprise", "Paradise", "Reading", "Delta",
  "Mission", "Victoria", "Jackson", "Austin", "Lincoln", "Tyler", "Allen", "Kent", "Warren", "Irving",
  "Madison", "Charlotte", "Florence", "Georgetown", "Concord", "Dover", "Troy", "Moore", "Spring",
  "Cypress", "Temple", "Bryan", "Logan", "Murray", "Sandy", "Taylor", "Wyoming", "Albany", "Auburn",
  "Columbia", "Hamilton", "Chester", "Allen", "Mesa", "Nelson", "Duncan", "Sidney", "Milton", "Ajax",
  "Aurora", "Cornwall", "Stratford", "Bedford", "Paterson", "Canton", "Mentor", "Mason", "Sumter",
  "Springfield", "Franklin", "Clinton", "Lancaster", "Norfolk", "York", "Newport", "Brandon",
]);

// [city, province/state, country], Canada first.
export const CITIES = [
  ...Object.entries(CA_CITIES).flatMap(([province, cities]) => cities.map((city) => [city, province, "CA"])),
  ...Object.entries(US_CITIES).flatMap(([state, cities]) => cities.map((city) => [city, state, "US"])),
];

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Longest names first so "North Vancouver" wins over "Vancouver".
const CITY_PATTERNS = [...CITIES]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([city, province, country]) => ({
    city,
    province,
    country,
    pattern: new RegExp(
      `(^|[^A-Za-zÀ-ÿ])${escapeRegExp(city)}(?=[^A-Za-zÀ-ÿ]|$)`,
      WORD_LIKE.has(city) ? "" : "i",
    ),
  }));

/**
 * The first known city named in `text`. With a province/state or country
 * already known, only cities there count, so "London ON" and "London KY"
 * (not listed) or "Vancouver WA" resolve correctly.
 */
export function findCity(text, { province, country } = {}) {
  if (!text) return null;
  for (const entry of CITY_PATTERNS) {
    if (province && entry.province !== province) continue;
    if (country && entry.country !== country) continue;
    if (entry.pattern.test(text)) return { city: entry.city, province: entry.province, country: entry.country };
  }
  return null;
}
