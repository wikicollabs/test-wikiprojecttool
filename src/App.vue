<!--
  WikiProject Tool
  A tool to identify WikiProjects on Wikidata that can be improved
  
  @license GPL-2.0-or-later
  @see https://github.com/wikicollabs
-->

<template>
  <div class="app">
    <CdxToastContainer />

    <AppHeader @home="goHome" ref="headerRef" />

    <main class="main-content">

      <div v-if="currentView === 'landing'" class="landing-view">
        <div class="body-frame">
          <section class="section-text">
            <h1>{{ $i18n('landing-spike-tagline') }}</h1>
            <p class="subtitle">{{ $i18n('landing-spike-subtitle') }}</p>
            <!-- Broomstick Information -->
            <div class="divider"></div>
            <cdx-message
              type="notice"
              :inline="true"
              :icon="broomstickIcon"
              class="broomstick-message"
            >
              {{ $i18n('landing-improve-lexemes-help') }} 
              <a 
                href="https://broomstick.toolforge.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="broomstick-link"
              >
                {{ $i18n('landing-improve-lexemes-link') }}
              </a>.
            </cdx-message>
          </section>
          <section class="section-form">
            <div class="landing-search-panel">
              <SearchForm
                v-model:wikiproject="selectedWikiproject"
                v-model:gapType="selectedGapType"
                :disabled="isLoading"
                @search="executeSearch"
              />
            </div>
          </section>
        </div>
      </div>

      <div v-else-if="currentView === 'search'" class="search-view">
        <div class="search-content">
          <div class="header-row">
            <CdxButton
              v-show="isPanelCollapsed"
              @click="isPanelCollapsed = false"
              class="expand-button"
              :aria-label="activeFilterCount > 0 
                ? $i18n('search-show-panel-aria-with-filters',activeFilterCount)
                : $i18n('search-show-panel-aria')"
            >
              <CdxIcon :icon="cdxIconExpand" />
              {{ activeFilterCount > 0 
                  ? `${$i18n('search-show-panel')} (${activeFilterCount})`
                  : $i18n('search-show-panel') }}
            </CdxButton>
            <h1>
              <bdi>
                  <a 
                    v-if="getWikiprojectUrl(searchedWikiproject)"
                    :href="getWikiprojectUrl(searchedWikiproject)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="wikiproject-link">
                  WikiProject {{ getWikiprojectLabel(searchedWikiproject) }}<CdxIcon :icon="cdxIconLinkExternal" /></a>
                  <template v-else>WikiProject {{ getWikiprojectLabel(searchedWikiproject) }}</template>
              </bdi> · <bdi>{{ getQueryLabel(searchedGapType) }}</bdi>
            </h1>
          </div>

          <div class="search-layout">
            <div v-show="!isPanelCollapsed" class="results-search-panel">
              <div class="search-header">
                <h3 class="search-heading">{{ $i18n('search-heading') }}</h3>
                <CdxButton
                  @click="collapsePanel"
                  class="collapse-button"
                  :aria-label="$i18n('search-hide-panel-aria')"
                >
                  <CdxIcon :icon="cdxIconCollapse" />
                </CdxButton>
              </div>

              <SearchForm
                v-model:wikiproject="selectedWikiproject"
                v-model:gapType="selectedGapType"
                v-model:country="countryFilter"
                :countries="countries"
                :disabled="isLoading"
                :results-exist="results.length > 0"
                :search-has-run="!!searchedGapType"
                :active-filter-count="activeFilterCount"
                @search="executeSearch"
              />

              <div v-if="results.length > 0" class="filter-divider"></div>

              <div v-if="results.length > 0" class="filters-section">
                <div class="filters-header">
                  <h3>{{ $i18n('filters-heading') }}{{ activeFilterCount > 0 ? ` (${activeFilterCount})` : '' }}</h3>
                  <CdxButton
                    weight="quiet"
                    :disabled="!hasActiveFilters"
                    :aria-disabled="!hasActiveFilters"
                    @click="clearFilters"
                    class="clear-filters-button"
                  >
                    {{ $i18n('filters-clear-all') }}
                  </CdxButton>
                </div>
              
                 <div class="filters-controls">
                    <CdxTextInput
                      v-model="textFilter"
                      ref="textInputRef"
                      input-type="search"
                      :start-icon="cdxIconSearch"
                      :clearable="true"
                      :placeholder="$i18n('filters-text-placeholder')"
                      :aria-label="$i18n('filters-text-label-aria')"
                    />
                      </div>
              </div>
            </div>

          <div class="results-area">
            <div v-if="isLoading" class="loading-state" role="status" aria-live="assertive">
              <h3>{{ $i18n('results-querying') }}</h3>
              <CdxProgressBar :aria-label="$i18n('results-querying-aria')" aria-hidden="true" />
            </div>

              <CdxMessage v-else-if="error" type="error">
                {{ error }}
              </CdxMessage>

              <div v-else>
                <ResultsTable 
                  :results="filteredResults"
                  :total-count="results.length"
                  :connection-error="connectionError"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, getCurrentInstance, nextTick} from "vue";
import { CdxButton, CdxIcon, CdxProgressBar, CdxMessage, CdxTextInput, CdxSelect, CdxLabel, CdxCombobox, CdxField, CdxToastContainer, useToast } from "@wikimedia/codex";
import { cdxIconCollapse, cdxIconExpand, cdxIconSearch, cdxIconLinkExternal} from "@wikimedia/codex-icons";
import AppHeader from "./components/AppHeader.vue";
import SearchForm from "./components/SearchForm.vue";
import ResultsTable from "./components/ResultsTable.vue";
import AppFooter from "./components/AppFooter.vue";
import { WIKIPROJECT_GROUPS, getQuerySparql, getQueryOptionsForProject, getAllQueryValues } from "./data/queries.js";

const instance = getCurrentInstance();
const broomstickIcon = {
  path: "M17.7778 15.5556H20.0V20.0H15.5556V17.7778H2.2222V2.2222H17.7778V15.5556ZM6.1111 11.1111L5.5556 15.5556H11.6667L12.2222 12.2222L12.7778 15.5556H14.4444L13.8889 11.1111H6.1111ZM9.4444 4.4444V8.8889H7.2222C6.6086 8.8889 6.1111 9.3863 6.1111 10.0H13.8889C13.8889 9.3863 13.3914 8.8889 12.7778 8.8889H10.5556V4.4444H9.4444Z",
  shouldFlip: false
};

const $i18n = instance?.appContext.config.globalProperties.$i18n;

const toast = useToast();

const locale = computed(() => localStorage.getItem('locale') || 'en');

const currentView = ref("landing");
const isPanelCollapsed = ref(false);

const selectedWikiproject = ref("");
const selectedGapType = ref("");
const searchedWikiproject = ref("");
const searchedGapType = ref("");
const textFilter = ref('');
const headerRef = ref(null);
const countries = ref([]);

const isLoading = ref(false);
const error = ref(null);
const connectionError = ref(false);
const results = ref([]);

function saveLastSearch() {
  localStorage.setItem("spike_last_project", selectedWikiproject.value);
  localStorage.setItem("spike_last_query", selectedGapType.value);
}

function restoreLastSearch() {
  const savedProject = localStorage.getItem("spike_last_project");
  const savedQuery = localStorage.getItem("spike_last_query");
  const savedCountry = localStorage.getItem("spike_last_country");
  if (savedProject) selectedWikiproject.value = savedProject;
  if (savedQuery) selectedGapType.value = savedQuery;
  if (savedCountry) countryFilter.value = savedCountry;
}

async function fetchCountries() {
  const cached = sessionStorage.getItem('spike_countries');
  if (cached) {
    countries.value = JSON.parse(cached);
    return;
  }

  const sparql = `SELECT ?country ?countryLabel WHERE {
    ?country wdt:P31 wd:Q3624078 .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" . }
  } ORDER BY ?countryLabel`;

  try {
    const response = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: {
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `query=${encodeURIComponent(sparql)}`,
    });
    const data = await response.json();
    countries.value = data.results.bindings.map(b => ({
      value: b.country.value.split('/').pop(),
      label: b.countryLabel.value,
    }));
    sessionStorage.setItem('spike_countries', JSON.stringify(countries.value));
  } catch (err) {
    console.error('Failed to fetch countries:', err);
  }
}

function getQueryLabel(queryValue) {
  if (!queryValue) return '';
  const groups = getQueryOptionsForProject(searchedWikiproject.value);
  for (const group of groups) {
    const found = group.items.find(q => q.value === queryValue);
    if (found) return $i18n(found.label);
  }
  return queryValue;
}

function getWikiprojectLabel(projectValue) {
  if (!projectValue) return '';
  const found = WIKIPROJECT_GROUPS.find(p => p.value === projectValue);
  return found?.label || projectValue;
}

function getWikiprojectUrl(projectValue) {
  const found = WIKIPROJECT_GROUPS.find(p => p.value === projectValue);
  return found?.url || 'https://www.wikidata.org/wiki/Wikidata:WikiProjects';
}


function onPopState(event) {
  const view = event.state?.view || 'landing';
  currentView.value = view;
  if (view === 'landing') {
    countryFilter.value = '';
  }
}

function goHome() {
  if (currentView.value === 'search') {
    history.back();
  }
}

// call restore on mount
onMounted(async () => {
  history.replaceState({ view: 'landing' }, '');
  window.addEventListener('popstate', onPopState);

  restoreLastSearch();
  await fetchCountries();
  watch(currentView, (view) => {
    localStorage.setItem('spike_last_view', view);
  });
  window.addEventListener('beforeunload', () => {
    localStorage.setItem("spike_last_country", countryFilter.value || '');
  });

  const toastLang = localStorage.getItem('language_change_toast');
  if (toastLang) {
    toast.show({
      message: $i18n('settings-language-changed', toastLang),
      type: 'success',
      preventUserDismiss: true,
      autoDismiss: true,
    });
    localStorage.removeItem('language_change_toast');
  }

  const skipRequery = localStorage.getItem('spike_skip_requery');
    const lastView = localStorage.getItem('spike_last_view');
    if (skipRequery && lastView === 'search' && selectedWikiproject.value && selectedGapType.value) {
      localStorage.removeItem('spike_skip_requery');
      await executeSearch();
    }
});
async function executeSearch() {
  const querySparql = getQuerySparql(selectedGapType.value, countryFilter.value || null, countryFilter.value ? 500 : 50);

  if (!querySparql) {
    error.value = "Query not found.";
    return;
  }

  searchedWikiproject.value = selectedWikiproject.value;
  searchedGapType.value = selectedGapType.value;
  saveLastSearch();

  error.value = null;
  connectionError.value = false;
  isLoading.value = true;
  textFilter.value = '';
  if (currentView.value !== 'search') {
      history.pushState({ view: 'search' }, '');
    }
  currentView.value = "search";
  isPanelCollapsed.value = window.innerWidth < 640;
  results.value = [];

  try {
    const response = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: {
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `query=${encodeURIComponent(querySparql)}`,
    });

    if (!response.ok) throw new Error("Query failed");

    const data = await response.json();

    results.value = data.results.bindings.map((binding) => ({
      itemId: binding.item.value.split("/").pop(),
      label: binding.itemLabel?.value || "",
      country: binding.countryLabel?.value || "",
      countryQid: binding.country?.value?.split("/").pop() || "",
    }));

  } catch (err) {
    console.error("Query error:", err);
    connectionError.value = true;
  } finally {
    isLoading.value = false;
  }
}



function collapsePanel() {
  // blur any focused element inside the search panel
  if (document.activeElement) {
    document.activeElement.blur();
  }
  isPanelCollapsed.value = true;
}

const countryFilter = ref('');

const filteredResults = computed(() => {
  if (!textFilter.value) return results.value;
  const search = textFilter.value.toLowerCase();
  return results.value.filter(r =>
    r.label.toLowerCase().includes(search) ||
    r.itemId.toLowerCase().includes(search)
  );
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (textFilter.value) count++;
  return count;
});

const hasActiveFilters = computed(() =>
  textFilter.value.trim() !== ''
);

function clearFilters() {
  textFilter.value = '';
}

</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color-base);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* MOBILE FIRST */
.landing-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-100);
  flex: 1;
}

.body-frame {
  width: 100%;
  max-width: calc(100vw - 2 * var(--spacing-100)); 
  display: flex;
  flex-direction: column; /* stack vertically on mobile */
  gap: var(--spacing-100); 
}

.section-text {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.section-form {
  width: 100%;
}

.landing-view h1 {
  font-family: var(--font-family-serif);
  font-size: 1.625rem;
  font-weight: 400;
  line-height: 2.25rem;
  color: var(--color-emphasized);
  margin: 0 0 var(--spacing-50) 0;
}

.subtitle {
  font-size: var(--font-size-medium);
  margin: 0;
}

.divider {
  display: block;
  align-self: stretch;
  width: 100%;
  max-width: 100%;
  padding: 4px 0;
  margin-top: var(--spacing-50);
  margin-bottom: var(--spacing-50);
}

.divider::before {
  content: "";
  display: block;
  align-self: stretch;    
  height: 0; 
  border-bottom: 1px solid var(--border-color-base); 
}

[dir=ltr] .broomstick-message :deep(.cdx-message__content) {
  margin-left: -2px;
}

[dir=rtl] .broomstick-message :deep(.cdx-message__content) {
  margin-right: -2px;
}

.broomstick-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-50);
  align-self: stretch;
}

.broomstick-message :deep(.cdx-icon) {
  color: var(--color-progressive--hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.broomstick-message :deep(.cdx-message__icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.broomstick-link {
  color: var(--color-progressive);
  text-decoration: none;
}


.landing-search-panel {
  width: 100%;
  box-sizing: border-box; /* includes padding/border in width */
  background-color: var(--background-color-interactive);
  border: 0.0625rem solid var(--border-color-base);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}


/* LANDING VIEW - TABLET PORTRAIT */
@media (min-width: 640px) and (max-width: 1023px) {
  .landing-view {
    padding: var(--spacing-200); /* 32px padding */
  }

  .body-frame {
    justify-content: flex-start; /* top-align instead of center */
    gap: var(--spacing-200); /* 32px between h1 section and search panel */
  }
  
  .section-text {
    width: 100%;
  }
  
  .section-form {
    width: 100%;
  }
  
}


/* LANDING VIEW - DESKTOP */
@media (min-width: 1024px) {
  .landing-view {
    padding: var(--spacing-200); 
  }

  .body-frame {
    max-width: 56rem; 
    flex-direction: row; /* side-by-side */
    gap: var(--spacing-150); 
  }

  .section-text {
    width: 30rem; 
  }

  .section-form {
    width: 24rem; 
  }

}

/* SEARCH VIEW - MOBILE FIRST */
.search-view {
  padding: var(--spacing-100); 
  flex: 1;
}

.search-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.header-row {
  display: flex;
  flex-direction: column-reverse; /* stack on mobile */
  align-items: flex-start; /* align to left */
  gap: var(--spacing-100);
}

/* DESKTOP */
@media (min-width: 1024px) {
  .header-row {
    flex-direction: row;
    align-items: center;
  }

  .header-row h1 {
    flex: 1; /* h1 takes remaining space */
  }
}

.search-content h1 {
  color: var(--color-emphasized);
  font-family: var(--font-family-serif); 
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.25;
  margin: 0;
  width: 100%; /* full width on mobile */
}

.wikiproject-link {
  color: var(--color-progressive);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
  font-weight: inherit;
}

.wikiproject-link:hover {
  text-decoration: underline;
}

.wikiproject-link :deep(.cdx-icon) {
  color: var(--color-progressive);
  font-size: 0.875rem;
}

.search-layout {
  width: 100%;
  display: flex;
  flex-direction: column; /* stack on mobile */
  align-items: flex-start;
  gap: var(--spacing-100);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-75);
}

.search-heading {
  margin: 0;
  color: var(--color-emphasized);
  font-weight: 700;
}

/* search results page search panel */
.results-search-panel {
  width: 100%;
  background-color: var(--background-color-interactive);
  border: 0.0625rem solid var(--border-color-base);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75);
}

.results-search-panel :deep(.cdx-field) {
  margin-bottom: 0;
}

.results-area {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.loading-state {
  padding: var(--spacing-100);
  border: 0.0625rem solid var(--border-color-base);
  border-radius: var(--border-radius-base);
  width: 100%;
}

.loading-state h3 {
  margin: 0 0 var(--spacing-100) 0;
  color: var(--color-emphasized);
  text-align: center;
}

.loading-state :deep(.cdx-progress-bar__bar) {
  background-color: var(--background-color-progressive) !important;
}

@media (min-width: 1024px) {
  .loading-state :deep(.cdx-progress-bar) {
    max-width: 32rem;
    margin: 0 auto;
  }
}

.collapse-button {
  width: var(--size-200);
  height: var(--size-200);
}

.collapse-button,
.expand-button {
  background-color: var(--background-color-interactive-subtle) !important;
  border: 1px solid var(--border-color-interactive) !important;
}

.expand-button {
  width: 100% !important;
  max-width: none !important;
  font-size: var(--font-size-medium);
  line-height: var(--line-height-small);
  font-weight: 700;
}

@media (min-width: 1024px) {
  .expand-button {
    width: auto !important;
    max-width: none !important;
    white-space: nowrap !important;
    padding: var(--spacing-25) var(--spacing-75) !important;
    flex-shrink: 0;
  }
}

/* SEARCH VIEW - TABLET PORTRAIT */
@media (min-width: 640px) and (max-width: 1023px) {
  .search-view {
    padding: var(--spacing-200); /* 32px on tablet */
  }
  
  .search-layout {
    flex-direction: column; /* vertical stack like mobile */
    gap: var(--spacing-150); /* 24px gutter */
  }
  
  .results-search-panel {
    width: 100%; /* full width in vertical layout */
  }
}

/* SEARCH VIEW - DESKTOP */
@media (min-width: 1024px) {
  .search-view {
    padding: var(--spacing-200); /* 32px on desktop */
  }

  .search-layout {
    flex-direction: row; /* side-by-side on desktop */
    gap: var(--spacing-150); /* 24px gutter */
    min-height: 25.5rem;
  }

  .results-search-panel {
    width: 24rem;
    max-width: 24rem;
  }
}

.filter-divider {
  width: 100%;
  height: 0.0625rem;
  background-color: var(--border-color-base);
  margin-top: var(--spacing-75);
  margin-bottom: var(--spacing-75);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-75);
}

.filters-header h3 {
  margin: 0;
  font-size: var(--font-size-large);
  font-weight: 700;
  color: var(--color-emphasized);
}


.clear-filters-button {
  border-radius: var(--border-radius-base);
  border: 0.0625rem solid var(--border-color-interactive) !important;
  background-color: var(--background-color-interactive-subtle) !important;
  color: var(--color-base) !important;
  font-size: var(--font-size-medium);
  font-weight: 700;
  line-height: var(--line-height-small);
  font-family: var(--font-family-system-sans);
}

.clear-filters-button:disabled {
  border: 0.0625rem solid var(--border-color-transparent) !important;
  background-color: var(--background-color-disabled) !important;
  color: var(--color-disabled) !important;
  cursor: not-allowed;
}

.filters-controls :deep(.cdx-label) {
  padding-bottom: var(--spacing-25);
}

.filters-controls :deep(.cdx-label__label__text) {
  overflow: visible;
  text-overflow: ellipsis;
}

:deep(.cdx-combobox) {
  width: 100%;
}

:deep(.cdx-combobox__input) {
  width: 100%;
}

.category-filter-error {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-50);
  color: var(--color-error);
  font-size: var(--font-size-medium);
  font-weight: 400 !important;
  margin-top: var(--spacing-25);
}

.category-filter-error :deep(.cdx-icon) {
  margin-top: 2px;
  color: var(--color-error);
  width: 20px;
  height: 20px;
  min-width: 20px;
}

.category-filter-error :deep(.cdx-message__content) {
  margin-left: 0;
  line-height: var(--line-height-small);
}
</style>