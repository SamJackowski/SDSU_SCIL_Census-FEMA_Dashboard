const https = require("https");
const zlib = require("zlib");
const fs = require("fs");
const readline = require("readline");

// We will fetch 2015 and 2016 NOAA NCEI Storm Events Details
const urls = [
  "https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d2015_c20220425.csv.gz",
  "https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d2016_c20220719.csv.gz"
];

// Target months: Nov 2015 - Mar 2016 (Peak El Nino)
const targetMonths = ["2015-11", "2015-12", "2016-01", "2016-02", "2016-03"];

// Relevant event types for El Nino damage (heavy precipitation, floods, coastal events)
const relevantEvents = [
  "Flash Flood", "Flood", "Heavy Rain", "Coastal Flood", "Debris Flow", 
  "High Surf", "Strong Wind", "Thunderstorm Wind", "Tornado"
];

const parseDamage = (val) => {
  if (!val || val === "0" || val === "") return 0;
  const num = parseFloat(val);
  if (isNaN(num)) return 0;
  if (val.endsWith("K")) return num * 1000;
  if (val.endsWith("M")) return num * 1000000;
  if (val.endsWith("B")) return num * 1000000000;
  return num;
};

const countyDamages = new Map();

const processFile = (url) => {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    https.get(url, (response) => {
      const gunzip = zlib.createGunzip();
      const rl = readline.createInterface({
        input: response.pipe(gunzip),
        crlfDelay: Infinity
      });

      let headers = [];
      rl.on("line", (line) => {
        // Handle CSV splitting properly (ignoring commas inside quotes)
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/(^"|"$)/g, ""));
        
        if (headers.length === 0) {
          headers = cols;
          return;
        }

        const stateFips = cols[headers.indexOf("STATE_FIPS")];
        const czFips = cols[headers.indexOf("CZ_FIPS")];
        const eventType = cols[headers.indexOf("EVENT_TYPE")];
        const beginYearMonth = cols[headers.indexOf("BEGIN_YEARMONTH")];
        const damageProp = cols[headers.indexOf("DAMAGE_PROPERTY")];
        const damageCrop = cols[headers.indexOf("DAMAGE_CROP")];

        if (!stateFips || !czFips) return;

        // Format to YYYY-MM
        const monthStr = `${beginYearMonth.substring(0,4)}-${beginYearMonth.substring(4,6)}`;
        
        if (targetMonths.includes(monthStr) && relevantEvents.includes(eventType)) {
          const countyFips = stateFips.padStart(2, "0") + czFips.padStart(3, "0");
          const prop = parseDamage(damageProp);
          const crop = parseDamage(damageCrop);
          
          if (prop > 0 || crop > 0) {
            if (!countyDamages.has(countyFips)) {
              countyDamages.set(countyFips, { property_damage: 0, crop_damage: 0 });
            }
            const current = countyDamages.get(countyFips);
            current.property_damage += prop;
            current.crop_damage += crop;
          }
        }
      });

      rl.on("close", resolve);
      rl.on("error", reject);
    }).on("error", reject);
  });
};

async function main() {
  for (const url of urls) {
    await processFile(url);
  }

  // Write output CSV
  const outPath = "./data/events/el_nino_2015_16_damages_by_county.csv";
  const ws = fs.createWriteStream(outPath);
  ws.write("GEOID,property_damage,crop_damage,total_damage\n");
  
  for (const [fips, data] of countyDamages.entries()) {
    const total = data.property_damage + data.crop_damage;
    ws.write(`${fips},${data.property_damage},${data.crop_damage},${total}\n`);
  }
  
  ws.end();
  console.log(`Successfully wrote ${countyDamages.size} counties to ${outPath}`);
}

main().catch(console.error);

