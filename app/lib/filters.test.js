import {
  VISION_FILTERS,
  getFilter,
  getAllFilterIds,
  getCategorizedFilters,
  SVG_FILTER_MATRICES,
  generateSVGFilters,
} from './filters'

describe('VISION_FILTERS', () => {
  it('contains all expected filters', () => {
    expect(VISION_FILTERS.none).toBeDefined()
    expect(VISION_FILTERS.protanopia).toBeDefined()
    expect(VISION_FILTERS.deuteranopia).toBeDefined()
    expect(VISION_FILTERS.tritanopia).toBeDefined()
    expect(VISION_FILTERS.achromatopsia).toBeDefined()
    expect(VISION_FILTERS.cataracts).toBeDefined()
    expect(VISION_FILTERS.lowVision).toBeDefined()
    expect(VISION_FILTERS.lowContrast).toBeDefined()
  })
  
  it('has correct structure for each filter', () => {
    Object.values(VISION_FILTERS).forEach(filter => {
      expect(filter).toHaveProperty('id')
      expect(filter).toHaveProperty('name')
      expect(filter).toHaveProperty('description')
      expect(filter).toHaveProperty('filter')
      expect(filter).toHaveProperty('prevalence')
    })
  })
  
  it('has unique IDs', () => {
    const ids = Object.values(VISION_FILTERS).map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('getFilter', () => {
  it('returns filter object for valid ID', () => {
    const filter = getFilter('protanopia')
    expect(filter).toBeDefined()
    expect(filter.id).toBe('protanopia')
    expect(filter.name).toBe('Protanopia')
  })
  
  it('returns null for invalid ID', () => {
    const filter = getFilter('invalid')
    expect(filter).toBeNull()
  })
  
  it('returns correct filter for each valid ID', () => {
    const ids = ['none', 'deuteranopia', 'tritanopia', 'achromatopsia']
    ids.forEach(id => {
      const filter = getFilter(id)
      expect(filter).toBeDefined()
      expect(filter.id).toBe(id)
    })
  })
})

describe('getAllFilterIds', () => {
  it('returns array of all filter IDs', () => {
    const ids = getAllFilterIds()
    expect(Array.isArray(ids)).toBe(true)
    expect(ids.length).toBeGreaterThan(0)
  })
  
  it('includes all expected IDs', () => {
    const ids = getAllFilterIds()
    expect(ids).toContain('none')
    expect(ids).toContain('protanopia')
    expect(ids).toContain('deuteranopia')
    expect(ids).toContain('tritanopia')
    expect(ids).toContain('achromatopsia')
  })
})

describe('getCategorizedFilters', () => {
  it('returns filters categorized correctly', () => {
    const categorized = getCategorizedFilters()
    expect(categorized).toHaveProperty('colorblind')
    expect(categorized).toHaveProperty('other')
  })
  
  it('has correct filters in colorblind category', () => {
    const { colorblind } = getCategorizedFilters()
    expect(colorblind).toHaveLength(4)
    const ids = colorblind.map(f => f.id)
    expect(ids).toContain('protanopia')
    expect(ids).toContain('deuteranopia')
    expect(ids).toContain('tritanopia')
    expect(ids).toContain('achromatopsia')
  })
  
  it('has correct filters in other category', () => {
    const { other } = getCategorizedFilters()
    expect(other).toHaveLength(3)
    const ids = other.map(f => f.id)
    expect(ids).toContain('cataracts')
    expect(ids).toContain('lowVision')
    expect(ids).toContain('lowContrast')
  })
})

describe('SVG_FILTER_MATRICES', () => {
  it('has matrices for colorblind filters', () => {
    expect(SVG_FILTER_MATRICES.protanopia).toBeDefined()
    expect(SVG_FILTER_MATRICES.deuteranopia).toBeDefined()
    expect(SVG_FILTER_MATRICES.tritanopia).toBeDefined()
  })
  
  it('has correct matrix dimensions', () => {
    Object.values(SVG_FILTER_MATRICES).forEach(matrix => {
      expect(matrix).toHaveLength(20) // 4x5 matrix flattened
      expect(matrix.every(val => typeof val === 'number')).toBe(true)
    })
  })
})

describe('generateSVGFilters', () => {
  it('returns SVG string', () => {
    const svg = generateSVGFilters()
    expect(typeof svg).toBe('string')
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })
  
  it('includes all filter definitions', () => {
    const svg = generateSVGFilters()
    expect(svg).toContain('id="protanopia"')
    expect(svg).toContain('id="deuteranopia"')
    expect(svg).toContain('id="tritanopia"')
  })
  
  it('includes feColorMatrix elements', () => {
    const svg = generateSVGFilters()
    expect(svg).toContain('<feColorMatrix')
    expect(svg).toContain('type="matrix"')
  })
  
  it('is hidden from accessibility tree', () => {
    const svg = generateSVGFilters()
    expect(svg).toContain('aria-hidden="true"')
  })
})

