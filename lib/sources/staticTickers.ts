// Static fallback data for the most-searched Indian listed companies.
// Used when BSE / NSE search APIs are unavailable (Cloudflare egress is
// commonly blocked / rate-limited by both exchanges). Source of truth: BSE
// & NSE listing pages as of 2025. Only used to resolve identity — discovery
// still goes through BSE corporate announcements.

export interface StaticTicker {
  name: string;
  bseCode: string;
  nseSymbol: string;
  isin: string;
  sector?: string;
  industry?: string;
  website?: string;
  aliases?: string[]; // alternate spellings the user might type
}

export const STATIC_TICKERS: StaticTicker[] = [
  { name: "Reliance Industries Ltd.", bseCode: "500325", nseSymbol: "RELIANCE", isin: "INE002A01018", sector: "Energy", industry: "Refineries", website: "https://www.ril.com", aliases: ["reliance", "ril"] },
  { name: "Tata Consultancy Services Ltd.", bseCode: "532540", nseSymbol: "TCS", isin: "INE467B01029", sector: "Information Technology", industry: "IT Services", website: "https://www.tcs.com", aliases: ["tcs"] },
  { name: "Infosys Ltd.", bseCode: "500209", nseSymbol: "INFY", isin: "INE009A01021", sector: "Information Technology", industry: "IT Services", website: "https://www.infosys.com", aliases: ["infy", "infosys"] },
  { name: "HDFC Bank Ltd.", bseCode: "500180", nseSymbol: "HDFCBANK", isin: "INE040A01034", sector: "Financial Services", industry: "Private Banks", website: "https://www.hdfcbank.com", aliases: ["hdfcbank", "hdfc bank"] },
  { name: "ICICI Bank Ltd.", bseCode: "532174", nseSymbol: "ICICIBANK", isin: "INE090A01021", sector: "Financial Services", industry: "Private Banks", website: "https://www.icicibank.com", aliases: ["icicibank", "icici"] },
  { name: "ITC Ltd.", bseCode: "500875", nseSymbol: "ITC", isin: "INE154A01025", sector: "Consumer Staples", industry: "FMCG", website: "https://www.itcportal.com", aliases: ["itc"] },
  { name: "Bharti Airtel Ltd.", bseCode: "532454", nseSymbol: "BHARTIARTL", isin: "INE397D01024", sector: "Communication Services", industry: "Telecom Services", website: "https://www.airtel.in", aliases: ["airtel", "bhartiartl"] },
  { name: "State Bank of India", bseCode: "500112", nseSymbol: "SBIN", isin: "INE062A01020", sector: "Financial Services", industry: "Public Sector Banks", website: "https://www.sbi.co.in", aliases: ["sbi", "sbin"] },
  { name: "Larsen & Toubro Ltd.", bseCode: "500510", nseSymbol: "LT", isin: "INE018A01030", sector: "Industrials", industry: "Construction & Engineering", website: "https://www.larsentoubro.com", aliases: ["lnt", "l&t", "lt"] },
  { name: "Bajaj Finance Ltd.", bseCode: "500034", nseSymbol: "BAJFINANCE", isin: "INE296A01024", sector: "Financial Services", industry: "Consumer Finance", website: "https://www.bajajfinserv.in", aliases: ["bajfinance", "bajaj finance"] },
  { name: "HCL Technologies Ltd.", bseCode: "532281", nseSymbol: "HCLTECH", isin: "INE860A01027", sector: "Information Technology", industry: "IT Services", website: "https://www.hcltech.com", aliases: ["hcltech", "hcl"] },
  { name: "Asian Paints Ltd.", bseCode: "500820", nseSymbol: "ASIANPAINT", isin: "INE021A01026", sector: "Materials", industry: "Paints", website: "https://www.asianpaints.com", aliases: ["asianpaint", "asian paints"] },
  { name: "Maruti Suzuki India Ltd.", bseCode: "532500", nseSymbol: "MARUTI", isin: "INE585B01010", sector: "Consumer Discretionary", industry: "Automobiles", website: "https://www.marutisuzuki.com", aliases: ["maruti", "marutisuzuki"] },
  { name: "Sun Pharmaceutical Industries Ltd.", bseCode: "524715", nseSymbol: "SUNPHARMA", isin: "INE044A01036", sector: "Healthcare", industry: "Pharmaceuticals", website: "https://www.sunpharma.com", aliases: ["sunpharma", "sun pharma"] },
  { name: "Wipro Ltd.", bseCode: "507685", nseSymbol: "WIPRO", isin: "INE075A01022", sector: "Information Technology", industry: "IT Services", website: "https://www.wipro.com", aliases: ["wipro"] },
  { name: "Axis Bank Ltd.", bseCode: "532215", nseSymbol: "AXISBANK", isin: "INE238A01034", sector: "Financial Services", industry: "Private Banks", website: "https://www.axisbank.com", aliases: ["axisbank", "axis bank"] },
  { name: "Nestle India Ltd.", bseCode: "500790", nseSymbol: "NESTLEIND", isin: "INE239A01024", sector: "Consumer Staples", industry: "Packaged Foods", website: "https://www.nestle.in", aliases: ["nestle", "nestleind"] },
  { name: "UltraTech Cement Ltd.", bseCode: "532538", nseSymbol: "ULTRACEMCO", isin: "INE481G01011", sector: "Materials", industry: "Cement", website: "https://www.ultratechcement.com", aliases: ["ultracemco", "ultratech"] },
  { name: "Titan Company Ltd.", bseCode: "500114", nseSymbol: "TITAN", isin: "INE280A01028", sector: "Consumer Discretionary", industry: "Jewellery", website: "https://www.titancompany.in", aliases: ["titan"] },
  { name: "NTPC Ltd.", bseCode: "532555", nseSymbol: "NTPC", isin: "INE733E01010", sector: "Utilities", industry: "Power Generation", website: "https://www.ntpc.co.in", aliases: ["ntpc"] },
  { name: "Tech Mahindra Ltd.", bseCode: "532755", nseSymbol: "TECHM", isin: "INE669C01036", sector: "Information Technology", industry: "IT Services", website: "https://www.techmahindra.com", aliases: ["techm", "tech mahindra"] },
  { name: "Power Grid Corporation of India Ltd.", bseCode: "532898", nseSymbol: "POWERGRID", isin: "INE752E01010", sector: "Utilities", industry: "Power Transmission", website: "https://www.powergrid.in", aliases: ["powergrid"] },
  { name: "Oil and Natural Gas Corporation Ltd.", bseCode: "500312", nseSymbol: "ONGC", isin: "INE213A01029", sector: "Energy", industry: "Oil & Gas Exploration", website: "https://www.ongcindia.com", aliases: ["ongc"] },
  { name: "Adani Enterprises Ltd.", bseCode: "512599", nseSymbol: "ADANIENT", isin: "INE423A01024", sector: "Industrials", industry: "Trading & Distribution", website: "https://www.adanienterprises.com", aliases: ["adanient", "adani enterprises"] },
  { name: "Coal India Ltd.", bseCode: "533278", nseSymbol: "COALINDIA", isin: "INE522F01014", sector: "Energy", industry: "Coal", website: "https://www.coalindia.in", aliases: ["coalindia"] },
  { name: "Hindalco Industries Ltd.", bseCode: "500440", nseSymbol: "HINDALCO", isin: "INE038A01020", sector: "Materials", industry: "Aluminium", website: "https://www.hindalco.com", aliases: ["hindalco"] },
  { name: "JSW Steel Ltd.", bseCode: "500228", nseSymbol: "JSWSTEEL", isin: "INE019A01038", sector: "Materials", industry: "Steel", website: "https://www.jsw.in", aliases: ["jswsteel", "jsw steel"] },
  { name: "Britannia Industries Ltd.", bseCode: "500825", nseSymbol: "BRITANNIA", isin: "INE216A01030", sector: "Consumer Staples", industry: "Packaged Foods", website: "https://www.britannia.co.in", aliases: ["britannia"] },
  { name: "Cipla Ltd.", bseCode: "500087", nseSymbol: "CIPLA", isin: "INE059A01026", sector: "Healthcare", industry: "Pharmaceuticals", website: "https://www.cipla.com", aliases: ["cipla"] },
  { name: "Mahindra & Mahindra Ltd.", bseCode: "500520", nseSymbol: "M&M", isin: "INE101A01026", sector: "Consumer Discretionary", industry: "Automobiles", website: "https://www.mahindra.com", aliases: ["mahindra", "m&m", "mm"] },
  { name: "Bajaj Auto Ltd.", bseCode: "532977", nseSymbol: "BAJAJ-AUTO", isin: "INE917I01010", sector: "Consumer Discretionary", industry: "Automobiles", website: "https://www.bajajauto.com", aliases: ["bajajauto", "bajaj-auto", "bajaj auto"] },
  { name: "Indian Oil Corporation Ltd.", bseCode: "530965", nseSymbol: "IOC", isin: "INE242A01010", sector: "Energy", industry: "Refineries", website: "https://www.iocl.com", aliases: ["ioc", "iocl"] },
  { name: "Eicher Motors Ltd.", bseCode: "505200", nseSymbol: "EICHERMOT", isin: "INE066A01021", sector: "Consumer Discretionary", industry: "Automobiles", website: "https://www.eicher.in", aliases: ["eichermot", "eicher"] },
  { name: "Bharat Petroleum Corporation Ltd.", bseCode: "500547", nseSymbol: "BPCL", isin: "INE029A01011", sector: "Energy", industry: "Refineries", website: "https://www.bharatpetroleum.in", aliases: ["bpcl"] },
  { name: "Hindustan Unilever Ltd.", bseCode: "500696", nseSymbol: "HINDUNILVR", isin: "INE030A01027", sector: "Consumer Staples", industry: "FMCG", website: "https://www.hul.co.in", aliases: ["hindunilvr", "hul", "hindustan unilever"] },
  { name: "Dr. Reddy's Laboratories Ltd.", bseCode: "500124", nseSymbol: "DRREDDY", isin: "INE089A01023", sector: "Healthcare", industry: "Pharmaceuticals", website: "https://www.drreddys.com", aliases: ["drreddy", "dr reddy"] },
  { name: "Apollo Hospitals Enterprise Ltd.", bseCode: "508869", nseSymbol: "APOLLOHOSP", isin: "INE437A01024", sector: "Healthcare", industry: "Healthcare Services", website: "https://www.apollohospitals.com", aliases: ["apollohosp", "apollo hospitals"] },
  { name: "Grasim Industries Ltd.", bseCode: "500300", nseSymbol: "GRASIM", isin: "INE047A01021", sector: "Materials", industry: "Diversified", website: "https://www.grasim.com", aliases: ["grasim"] },
  { name: "Tata Steel Ltd.", bseCode: "500470", nseSymbol: "TATASTEEL", isin: "INE081A01020", sector: "Materials", industry: "Steel", website: "https://www.tatasteel.com", aliases: ["tatasteel", "tata steel"] },
  { name: "Tata Motors Ltd.", bseCode: "500570", nseSymbol: "TATAMOTORS", isin: "INE155A01022", sector: "Consumer Discretionary", industry: "Automobiles", website: "https://www.tatamotors.com", aliases: ["tatamotors", "tata motors"] },
  { name: "Adani Ports and SEZ Ltd.", bseCode: "532921", nseSymbol: "ADANIPORTS", isin: "INE742F01042", sector: "Industrials", industry: "Ports & Logistics", website: "https://www.adaniports.com", aliases: ["adaniports", "adani ports"] },
  { name: "IndusInd Bank Ltd.", bseCode: "532187", nseSymbol: "INDUSINDBK", isin: "INE095A01012", sector: "Financial Services", industry: "Private Banks", website: "https://www.indusind.com", aliases: ["indusindbk", "indusind"] },
  { name: "Bajaj Finserv Ltd.", bseCode: "532978", nseSymbol: "BAJAJFINSV", isin: "INE918I01018", sector: "Financial Services", industry: "Insurance & NBFC", website: "https://www.bajajfinserv.in", aliases: ["bajajfinsv", "bajaj finserv"] },
  { name: "HDFC Life Insurance Company Ltd.", bseCode: "540777", nseSymbol: "HDFCLIFE", isin: "INE795G01014", sector: "Financial Services", industry: "Insurance", website: "https://www.hdfclife.com", aliases: ["hdfclife", "hdfc life"] },
  { name: "SBI Life Insurance Company Ltd.", bseCode: "540719", nseSymbol: "SBILIFE", isin: "INE123W01016", sector: "Financial Services", industry: "Insurance", website: "https://www.sbilife.co.in", aliases: ["sbilife", "sbi life"] },
  { name: "Bharat Electronics Ltd.", bseCode: "500049", nseSymbol: "BEL", isin: "INE263A01024", sector: "Industrials", industry: "Defence", website: "https://bel-india.in", aliases: ["bel", "bharat electronics"] },
  { name: "DLF Ltd.", bseCode: "532868", nseSymbol: "DLF", isin: "INE271C01023", sector: "Real Estate", industry: "Real Estate", website: "https://www.dlf.in", aliases: ["dlf"] },
  { name: "Pidilite Industries Ltd.", bseCode: "500331", nseSymbol: "PIDILITIND", isin: "INE318A01026", sector: "Materials", industry: "Specialty Chemicals", website: "https://www.pidilite.com", aliases: ["pidilitind", "pidilite"] },
  { name: "Avenue Supermarts Ltd.", bseCode: "540376", nseSymbol: "DMART", isin: "INE192R01011", sector: "Consumer Staples", industry: "Retailing", website: "https://www.dmartindia.com", aliases: ["dmart", "avenue supermarts"] },
  { name: "Vedanta Ltd.", bseCode: "500295", nseSymbol: "VEDL", isin: "INE205A01025", sector: "Materials", industry: "Metals & Mining", website: "https://www.vedantalimited.com", aliases: ["vedl", "vedanta"] },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9&]+/g, "").trim();
}

// Match a user query against the static table. Returns the best ticker
// or null. Match priority: exact NSE/BSE/alias > exact name > prefix > contains.
export function lookupStaticTicker(query: string): StaticTicker | null {
  const q = normalize(query);
  if (!q) return null;

  // Exact symbol or alias.
  for (const t of STATIC_TICKERS) {
    if (normalize(t.nseSymbol) === q) return t;
    if (normalize(t.bseCode) === q) return t;
    if (t.aliases?.some((a) => normalize(a) === q)) return t;
  }
  // Exact name.
  for (const t of STATIC_TICKERS) {
    if (normalize(t.name) === q) return t;
  }
  // Prefix match on name (drops trailing "Ltd"/etc via normalize).
  for (const t of STATIC_TICKERS) {
    if (normalize(t.name).startsWith(q) && q.length >= 3) return t;
  }
  // Contains match on name.
  for (const t of STATIC_TICKERS) {
    if (q.length >= 3 && normalize(t.name).includes(q)) return t;
  }
  return null;
}
