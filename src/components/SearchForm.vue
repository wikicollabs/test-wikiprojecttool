<!--
  WikiProject Tool
  A tool to identify WikiProjects on Wikidata that can be improved
  
  @license GPL-2.0-or-later
  @see https://github.com/wikicollabs
-->


<template>
  <div class="search-form">
    <cdx-field
      class="wikiproject-type-field"
      :status="wikiprojectError ? 'error' : 'default'"
    >
      <template #label>{{ $i18n('search-wikiproject-label') }}</template>
      <cdx-combobox
        v-model:selected="selectedWikiprojectValue"
        :menu-items="filteredWikiprojectOptions"
        placeholder="Select a WikiProject"
        aria-label="WikiProject"
        :class="{ 'combobox-error': wikiprojectError }"
        @input="onWikiprojectInput"
        @blur="onWikiprojectBlur"
        @focus="onWikiprojectFocus"
      />
    </cdx-field>
    <cdx-message
        v-if="wikiprojectError"
        type="error"
        :inline="true"
        class="error-message"
        ref="wikiprojectErrorRef"
        tabindex="-1"
    >
        {{ wikiprojectError }}
    </cdx-message>

    <cdx-field
      class="gap-type-field"
      :status="gapTypeError ? 'error' : 'default'"
    >
      <template #label>{{ $i18n('search-query-label') }}</template>
      <cdx-combobox
        :selected="getDisplayValue(selectedGapTypeValue)"
        :menu-items="filteredGapTypeOptions"
        @update:selected="onQuerySelected"
        :placeholder="$i18n('search-query-placeholder')"
        :aria-label="$i18n('search-query-label')"
        :class="{ 'combobox-error': gapTypeError }"
        @input="onGapTypeInput"
        @blur="onGapTypeBlur"
        @focus="onGapTypeFocus"
      />
    </cdx-field>
    <cdx-message
      v-if="gapTypeError"
      type="error"
      :inline="true"
      class="error-message"
      ref="gapTypeErrorRef"
      tabindex="-1"
    >
      {{ gapTypeError }}
    </cdx-message>

        <cdx-field
              v-if="searchHasRun"
              class="country-type-field"
              :status="countryError ? 'error' : 'default'"
            >
              <template #label>{{ $i18n('search-country-label') }}</template>
              <cdx-combobox
                v-model:selected="countryDisplayValue"
                :menu-items="filteredCountryOptions"
                :placeholder="$i18n('search-country-placeholder')"
                :class="{ 'combobox-error': countryError }"
                @input="onCountryInput"
                @blur="onCountryBlur"
                @focus="onCountryFocus"
              />
            </cdx-field>
            <cdx-message
              v-if="countryError"
              type="error"
              :inline="true"
              class="error-message"
              ref="countryErrorRef"
              tabindex="-1"
            >
              {{ countryError }}
            </cdx-message>

    <cdx-button
      action="progressive"
      weight="primary"
      type="button"
      :disabled="isSearchDisabled"
      :aria-label="$i18n('search-button')"
      :aria-disabled="isSearchDisabled"
      @click="handleSearch"
      class="search-button"
    >
      <cdx-icon :icon="cdxIconSearch" />
      {{ $i18n('search-button') }}
    </cdx-button>

    <cdx-message 
  v-if="hasChangedSelection && resultsExist && activeFilterCount > 0"
  type="notice"
  inline
  class="selection-change-notice"
  role="status"
>
  {{ $i18n('search-form-filter-clear-notice') }}
</cdx-message>
  </div>
</template>

<script setup>
import { computed, ref, watch, getCurrentInstance, nextTick } from "vue";
import { CdxField, CdxCombobox, CdxButton, CdxIcon, CdxMessage } from "@wikimedia/codex";
import { cdxIconSearch, cdxIconError } from "@wikimedia/codex-icons";
import {
  getWikiprojectOptions,
  getQueryOptionsForProject,
  getAllQueryValues,
} from "../data/queries.js";
const instance = getCurrentInstance();
const $i18n = instance?.appContext.config.globalProperties.$i18n;

const props = defineProps({
  wikiproject: {
    type: String,
    default: "",
  },
  gapType: {
    type: String,
    default: "",
  },
  country: {
  type: String,
  default: '',
},
countries: {
  type: Array,
  default: () => [],
},

searchHasRun: {
  type: Boolean,
  default: false,
},

  disabled: {
    type: Boolean,
    default: false,
  },

  activeFilterCount: {
  type: Number,
  default: 0
},

  resultsExist: Boolean
});

const hasChangedSelection = ref(false);

watch([() => props.wikiproject, () => props.gapType], () => {
  if (props.resultsExist) {
    hasChangedSelection.value = true;
  }
});

const emit = defineEmits(["update:wikiproject", "update:gapType", "update:country", "search"]);

const wikiprojectOptions = getWikiprojectOptions();

const gapTypeOptions = computed(() => {
  if (!props.wikiproject) return [];
  const raw = getQueryOptionsForProject(props.wikiproject);
  return raw.map(group => ({
    label: $i18n(group.label),
    items: group.items.map(item => ({
      value: item.value,
      label: $i18n(item.label),
    }))
  }));
});

const wikiprojectSearchTerm = ref("");
const gapTypeSearchTerm = ref("");
const wikiprojectBlurred = ref(false);
const gapTypeBlurred = ref(false);

const filteredWikiprojectOptions = computed(() => {
  if (!wikiprojectSearchTerm.value) return wikiprojectOptions;
  const search = wikiprojectSearchTerm.value.toLowerCase();
  return wikiprojectOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search)
  );
});

const filteredGapTypeOptions = computed(() => {
  if (!gapTypeSearchTerm.value) return gapTypeOptions.value;
  const search = gapTypeSearchTerm.value.toLowerCase();

  return gapTypeOptions.value
    .map((group) => ({
      label: group.label,
      items: group.items.filter((opt) =>
        opt.label.toLowerCase().includes(search)
      ),
    }))
    .filter((group) => group.items.length > 0);
});

const selectedWikiprojectValue = computed({
  get() {
    if (!props.wikiproject) return '';
    const opt = wikiprojectOptions.find(o => o.value === props.wikiproject);
    return opt ? opt.label : props.wikiproject;
  },
  set(value) {
    // combobox may emit label string or value string — normalize to value
    const opt = wikiprojectOptions.find(o => o.label === value || o.value === value);
    const resolved = opt ? opt.value : value;
    emit("update:wikiproject", resolved);
    emit("update:gapType", "");
  },
});

const selectedGapTypeValue = computed({
  get() {
    return props.gapType;
  },
  set(value) {
    emit("update:gapType", value);
  },
});

const wikiprojectError = computed(() => {
  if (!wikiprojectBlurred.value) return "";
  if (!props.wikiproject) return "";
  const validValues = wikiprojectOptions.map((opt) => opt.value);
  if (!validValues.includes(props.wikiproject)) {
    return "WikiProject not found. Try choosing another.";
  }
  return "";
});

const wikiprojectErrorRef = ref(null);

// watch for when the error appears
watch(wikiprojectError, (newError) => {
  if (newError) {
    nextTick(() => {
      wikiprojectErrorRef.value?.focus();
    });
  }
});



const gapTypeError = computed(() => {
  if (!gapTypeBlurred.value) return "";
  if (!props.gapType) return "";

  const validValues = getAllQueryValues();
  if (!validValues.includes(props.gapType)) {
    return $i18n('errors-query-not-found');
  }
  return "";
});

const gapTypeErrorRef = ref(null);

watch(gapTypeError, (newError) => {
  if (newError) {
    nextTick(() => {
      gapTypeErrorRef.value?.focus();
    });
  }
});



const countrySearchTerm = ref('');
const countryBlurred = ref(false);

const countryError = computed(() => {
  if (!countryBlurred.value) return "";
  if (!props.country) return ""; // empty = "all countries", always valid
  const validCountries = props.countries.map(c => c.value);
  if (!validCountries.includes(props.country)) {
    return $i18n('errors-country-not-found');
  }
  return "";
});

function onCountryBlur() {
  countryBlurred.value = true;
}

function onCountryFocus() {
  if (countryError.value && countrySearchTerm.value) {
    countrySearchTerm.value = "";
  }
  countryBlurred.value = false;
}

const countryErrorRef = ref(null);

watch(countryError, (newError) => {
  if (newError) {
    nextTick(() => {
      countryErrorRef.value?.focus();
    });
  }
});

const filteredCountryOptions = computed(() => {
  const all = [{ value: '', label: $i18n('search-country-placeholder') }, ...props.countries];
  if (!countrySearchTerm.value) return all;
  const search = countrySearchTerm.value.toLowerCase();
  return all.filter(c => c.label.toLowerCase().includes(search));
});

const countryDisplayValue = computed({
  get() {
    if (!props.country) return $i18n('search-country-placeholder');
    const found = props.countries.find(c => c.value === props.country);
    return found ? found.label : props.country;
  },
  set(val) {
    const found = props.countries.find(c => c.label === val || c.value === val);
    emit('update:country', found ? found.value : val);
  }
});

function onCountryInput(event) {
  countrySearchTerm.value = event.target.value;
}

const isSearchDisabled = computed(() => {
  if (!props.wikiproject || !props.gapType) return true;
  if (props.disabled) return true;
  const validProjects = wikiprojectOptions.map((opt) => opt.value);
  const validGapTypes = getAllQueryValues();
  if (!validProjects.includes(props.wikiproject)) return true;
  if (!validGapTypes.includes(props.gapType)) return true;
  if (props.country) {
    const validCountries = props.countries.map((c) => c.value);
    if (!validCountries.includes(props.country)) return true;
  }
  return false;
});

function onWikiprojectInput(event) {
  wikiprojectSearchTerm.value = event.target.value;
  // clear blur flag when user starts typing again
  if (wikiprojectBlurred.value && event.target.value === "") {
    wikiprojectBlurred.value = false;
  }
}

function onGapTypeInput(event) {
  gapTypeSearchTerm.value = event.target.value;
  // clear blur flag when user starts typing again
  if (gapTypeBlurred.value && event.target.value === "") {
    gapTypeBlurred.value = false;
  }
}

// finds the translated label for display
function getDisplayValue(value) {
  if (!value) return '';
  
  for (const group of filteredGapTypeOptions.value) {
    const item = group.items.find(i => i.value === value);
    if (item) return item.label;
  }
  return value;
}

// handles selection, emits the VALUE (for sparql lookup)
function onQuerySelected(selectedValue) {
  
  // combobox sends the value directly, just emit it
  emit("update:gapType", selectedValue);
}

function onWikiprojectBlur() {
  wikiprojectBlurred.value = true;
}

function onGapTypeBlur() {
  gapTypeBlurred.value = true;
}

function onWikiprojectFocus() {
  // clear search term if there's an error, allowing dropdown to work
  if (wikiprojectError.value && wikiprojectSearchTerm.value) {
    wikiprojectSearchTerm.value = "";
  }
  wikiprojectBlurred.value = false;
}

function onGapTypeFocus() {
  // clear search term if there's an error, allowing dropdown to work
  if (gapTypeError.value && gapTypeSearchTerm.value) {
    gapTypeSearchTerm.value = "";
  }
  gapTypeBlurred.value = false;
}

function handleSearch() {
  hasChangedSelection.value = false;
  wikiprojectBlurred.value = true;
  gapTypeBlurred.value = true;
  countryBlurred.value = true;

  if (!wikiprojectError.value && !gapTypeError.value && !countryError.value) {
    emit("search");
  }
}
</script>

<style scoped>
:deep(.combobox-error .cdx-text-input__input) {
  color: var(--color-error) !important;
}

.wikiproject-type-field,
.gap-type-field,
.country-type-field {
  margin-bottom: var(--spacing-75) !important;
}

.wikiproject-type-field + .error-message,
.gap-type-field + .error-message {
  margin-top: calc(var(--spacing-75) * -1);
  margin-bottom: var(--spacing-75) !important;
}

.error-message {
  margin-bottom: var(--spacing-75);
}

.gap-type-field {
  margin-top: 0 !important;
}

.search-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.search-form :deep(.cdx-field) {
  margin-block-start: 0 !important;
}

.search-button {
  width: 100%;
  min-width: 0; /* CRITICAL - allows it to shrink below codex defaults */
  max-width: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-50);
}

@media (min-width: 640px) {
  .search-button {
    width: 100%;
  }
}

.selection-change-notice {
  display: flex;
  align-items: flex-start;
  align-self: flex-start;
  gap: var(--spacing-50);
  color: var(--color-base);
  font-size: var(--font-size-medium);
  font-weight: 400 !important;
  margin-top: 0.75rem !important; 
}

.selection-change-notice :deep(.cdx-icon) {
  margin-top: 2px;
  color: var(--color-notice);
  width: 20px;
  height: 20px;
  min-width: 20px;
}

.selection-change-notice :deep(.cdx-message__content) {
  margin-left: 0;
  line-height: var(--line-height-small);
}

:deep(.cdx-field) {
  width: 100%;
  min-width: 0;
}

:deep(.cdx-combobox) {
  width: 100%;
  min-width: 0;
}

:deep(.cdx-text-input) {
  width: 100%;
  min-width: 0;
}

:deep(.cdx-text-input__input) {
  width: 100%;
  min-width: 0;
}

:deep(.wikiproject-type-field) {
  margin-top: 0;
}
:deep(.gap-type-field) {
  margin-top: 0;
}
:deep(.cdx-field--status-error .cdx-text-input__input) {
  background-color: var(--background-color-error-subtle);
}
</style>