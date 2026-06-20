/**
 * WikiProject Tool
 * A tool to identify WikiProjects on Wikidata that can be improved
 * 
 * @license GPL-2.0-or-later
 * @see https://github.com/wikicollabs
 */

export const WIKIPROJECT_GROUPS = [
  {
    value: 'paintings',
    label: 'Sum of All Paintings',
    url: 'https://www.wikidata.org/wiki/Wikidata%3AWikiProject_sum_of_all_paintings',
    queries: [
      {
        value: 'paintings-missing-inception',
        group: 'query-group-missing-metadata',
        label: 'query-paintings-missing-inception',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q3305213 ;
            wdt:P195 ?collection .
      ?collection wdt:P17 ?country .
      MINUS { ?item p:P571 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'paintings-missing-creator',
        group: 'query-group-missing-metadata',
        label: 'query-paintings-missing-creator',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q3305213 ;
            wdt:P195 ?collection .
      ?collection wdt:P17 ?country .
      MINUS { ?item p:P170 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'paintings-missing-material',
        group: 'query-group-missing-metadata',
        label: 'query-paintings-missing-material',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q3305213 ;
            wdt:P195 ?collection .
      ?collection wdt:P17 ?country .
      MINUS { ?item p:P186 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'paintings-missing-genre',
        group: 'query-group-missing-metadata',
        label: 'query-paintings-missing-genre',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q3305213 ;
            wdt:P195 ?collection .
      ?collection wdt:P17 ?country .
      MINUS { ?item p:P136 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'paintings-missing-image',
        group: 'query-group-missing-media',
        label: 'query-paintings-missing-image',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q3305213 ;
            wdt:P195 ?collection .
      ?collection wdt:P17 ?country .
      MINUS { ?item p:P18 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
    ],
  },
  {
    value: 'music',
    label: 'Music',
    url: 'https://www.wikidata.org/wiki/Wikidata%3AWikiProject_Music',
    queries: [
      {
        value: 'music-group-missing-inception',
        group: 'query-group-music-groups',
        label: 'query-music-group-missing-inception',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      VALUES ?class { wd:Q2088357 wd:Q215380 wd:Q42998 }
      ?item wdt:P31 ?class ;
            wdt:P740 ?formationPlace .
      ?formationPlace wdt:P17 ?country .
      MINUS { ?item p:P571 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'music-song-missing-composer',
        group: 'query-group-releases',
        label: 'query-music-song-missing-composer',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?performerLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      VALUES ?class { wd:Q7366 wd:Q207628 }
      ?performer wdt:P27 ?country .
      ?item wdt:P31 ?class ;
            wdt:P175 ?performer .
      MINUS { ?item p:P86 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'music-album-missing-record-label',
        group: 'query-group-releases',
        label: 'query-music-album-missing-record-label',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?performerLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      VALUES ?class { wd:Q482994 wd:Q169930 wd:Q134556 }
      ?performer wdt:P27 ?country .
      ?item wdt:P31 ?class ;
            wdt:P175 ?performer .
      MINUS { ?item p:P264 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'music-group-missing-members',
        group: 'query-group-music-groups',
        label: 'query-music-group-missing-members',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      VALUES ?class { wd:Q2088357 wd:Q215380 wd:Q42998 }
      ?item wdt:P31 ?class ;
            wdt:P740 ?formationPlace .
      ?formationPlace wdt:P17 ?country .
      MINUS { ?item p:P527 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
    ],
  },
  {
    value: 'podcasts',
    label: 'Podcasts',
    url: 'https://www.wikidata.org/wiki/Wikidata%3AWikiProject_Podcasts',
    queries: [
      {
        value: 'podcast-missing-feed-url',
        group: 'query-group-general',
        label: 'query-podcast-missing-feed-url',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q24634210 ;
            wdt:P495 ?country .
      MINUS { ?item p:P1019 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'podcast-missing-website',
        group: 'query-group-general',
        label: 'query-podcast-missing-website',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q24634210 ;
            wdt:P495 ?country .
      MINUS { ?item p:P856 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
      {
        value: 'podcast-missing-language',
        group: 'query-group-general',
        label: 'query-podcast-missing-language',
        hasCountry: true,
        sparql: (countryQid = null, limit = 50) => `
SELECT ?item ?itemLabel ?countryLabel WHERE {
  {
    SELECT DISTINCT ?item ?country WHERE {
      ${countryQid ? `VALUES ?country { wd:${countryQid} }` : ''}
      ?item wdt:P31 wd:Q24634210 ;
            wdt:P495 ?country .
      MINUS { ?item p:P407 [] }
    }
    LIMIT ${limit}
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en" .
  }
}`,
      },
    ],
  },
];

// get query options for a given wikiproject value, for CdxCombobox
export function getQueryOptionsForProject(projectValue) {
  const project = WIKIPROJECT_GROUPS.find((p) => p.value === projectValue);
  if (!project) return [];

  const groups = {};
  for (const q of project.queries) {
    const g = q.group || 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push({ value: q.value, label: q.label });
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// get sparql by query value, with optional countryQid + limit
export function getQuerySparql(queryValue, countryQid = null, limit = 50) {
  for (const project of WIKIPROJECT_GROUPS) {
    const query = project.queries.find((q) => q.value === queryValue);
    if (query) return query.sparql(countryQid, limit);
  }
  return null;
}

// get all query values as flat array (for validation)
export function getAllQueryValues() {
  return WIKIPROJECT_GROUPS.flatMap((p) => p.queries.map((q) => q.value));
}

// get wikiproject options for CdxCombobox
export function getWikiprojectOptions() {
  return WIKIPROJECT_GROUPS.map((p) => ({
    value: p.value,
    label: p.label,
  }));
}

// check if a query has country support
export function queryHasCountry(queryValue) {
  for (const project of WIKIPROJECT_GROUPS) {
    const query = project.queries.find((q) => q.value === queryValue);
    if (query) return query.hasCountry ?? false;
  }
  return false;
}