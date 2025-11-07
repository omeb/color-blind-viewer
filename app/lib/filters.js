/**
 * Vision Impairment Filter Definitions
 * 
 * This module contains CSS filter definitions for simulating various vision impairments.
 * Filters are based on research and accessibility standards.
 * 
 * @module filters
 */

/**
 * Filter definitions for different vision impairments
 * Each filter uses CSS filter property syntax
 */
export const VISION_FILTERS = {
  none: {
    id: 'none',
    name: 'Normal Vision',
    description: 'No visual impairment',
    filter: 'none',
    prevalence: 'Baseline',
  },
  
  protanopia: {
    id: 'protanopia',
    name: 'Protanopia',
    description: 'Red-blind. Difficulty distinguishing between red and green colors.',
    filter: 'url(#protanopia)',
    prevalence: '~1% of males',
    severity: 'Severe',
  },
  
  deuteranopia: {
    id: 'deuteranopia',
    name: 'Deuteranopia',
    description: 'Green-blind. The most common form of colorblindness.',
    filter: 'url(#deuteranopia)',
    prevalence: '~1% of males',
    severity: 'Severe',
  },
  
  tritanopia: {
    id: 'tritanopia',
    name: 'Tritanopia',
    description: 'Blue-blind. Difficulty with blue and yellow colors.',
    filter: 'url(#tritanopia)',
    prevalence: '~0.001% of population',
    severity: 'Severe',
  },
  
  achromatopsia: {
    id: 'achromatopsia',
    name: 'Achromatopsia',
    description: 'Complete colorblindness. Only see in grayscale.',
    filter: 'grayscale(100%)',
    prevalence: '~1 in 30,000',
    severity: 'Total',
  },
  
  cataracts: {
    id: 'cataracts',
    name: 'Cataracts',
    description: 'Clouding of the lens causing blurred, dimmed vision.',
    filter: 'blur(2px) contrast(0.7) brightness(0.8)',
    prevalence: '~50% over age 80',
    severity: 'Progressive',
  },
  
  lowVision: {
    id: 'lowVision',
    name: 'Low Vision',
    description: 'Reduced visual clarity and sharpness.',
    filter: 'blur(3px)',
    prevalence: '~3% of population',
    severity: 'Variable',
  },
  
  lowContrast: {
    id: 'lowContrast',
    name: 'Low Contrast Sensitivity',
    description: 'Difficulty distinguishing similar shades.',
    filter: 'contrast(0.5) brightness(0.9)',
    prevalence: 'Common with aging',
    severity: 'Moderate',
  },
}

/**
 * Get filter by ID
 * @param {string} id - Filter ID
 * @returns {Object|null} Filter object or null if not found
 */
export function getFilter(id) {
  return VISION_FILTERS[id] || null
}

/**
 * Get all filter IDs
 * @returns {string[]} Array of filter IDs
 */
export function getAllFilterIds() {
  return Object.keys(VISION_FILTERS)
}

/**
 * Get filters by category
 * @returns {Object} Categorized filters
 */
export function getCategorizedFilters() {
  return {
    colorblind: [
      VISION_FILTERS.protanopia,
      VISION_FILTERS.deuteranopia,
      VISION_FILTERS.tritanopia,
      VISION_FILTERS.achromatopsia,
    ],
    other: [
      VISION_FILTERS.cataracts,
      VISION_FILTERS.lowVision,
      VISION_FILTERS.lowContrast,
    ],
  }
}

/**
 * SVG filter matrices for colorblindness simulation
 * These matrices are based on:
 * - Brettel, Viénot and Mollon JOSA 1997
 * - Machado, Oliveira and Fernandes 2009
 */
export const SVG_FILTER_MATRICES = {
  protanopia: [
    0.567, 0.433, 0.000, 0, 0,
    0.558, 0.442, 0.000, 0, 0,
    0.000, 0.242, 0.758, 0, 0,
    0, 0, 0, 1, 0
  ],
  
  deuteranopia: [
    0.625, 0.375, 0.000, 0, 0,
    0.700, 0.300, 0.000, 0, 0,
    0.000, 0.300, 0.700, 0, 0,
    0, 0, 0, 1, 0
  ],
  
  tritanopia: [
    0.950, 0.050, 0.000, 0, 0,
    0.000, 0.433, 0.567, 0, 0,
    0.000, 0.475, 0.525, 0, 0,
    0, 0, 0, 1, 0
  ],
}

/**
 * Generate SVG filter definitions for colorblindness
 * @returns {string} SVG markup with filter definitions
 */
export function generateSVGFilters() {
  const filters = Object.entries(SVG_FILTER_MATRICES).map(([id, values]) => `
    <filter id="${id}">
      <feColorMatrix
        type="matrix"
        values="${values.join(' ')}"
      />
    </filter>
  `).join('')
  
  return `
    <svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
      <defs>
        ${filters}
      </defs>
    </svg>
  `
}

