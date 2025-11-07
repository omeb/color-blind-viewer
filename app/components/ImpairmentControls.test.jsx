import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImpairmentControls from './ImpairmentControls'

describe('ImpairmentControls', () => {
  const mockOnFilterChange = jest.fn()
  
  beforeEach(() => {
    mockOnFilterChange.mockClear()
  })
  
  it('renders all filter buttons', () => {
    render(<ImpairmentControls onFilterChange={mockOnFilterChange} />)
    
    // Check for colorblind filters
    expect(screen.getByText('Protanopia')).toBeInTheDocument()
    expect(screen.getByText('Deuteranopia')).toBeInTheDocument()
    expect(screen.getByText('Tritanopia')).toBeInTheDocument()
    expect(screen.getByText('Achromatopsia')).toBeInTheDocument()
    
    // Check for other filters
    expect(screen.getByText('Cataracts')).toBeInTheDocument()
    expect(screen.getByText('Low Vision')).toBeInTheDocument()
    expect(screen.getByText('Low Contrast Sensitivity')).toBeInTheDocument()
  })
  
  it('renders section titles', () => {
    render(<ImpairmentControls onFilterChange={mockOnFilterChange} />)
    
    expect(screen.getByText('Color Vision Deficiency')).toBeInTheDocument()
    expect(screen.getByText('Other Vision Impairments')).toBeInTheDocument()
  })
  
  it('calls onFilterChange when filter button is clicked', async () => {
    render(<ImpairmentControls onFilterChange={mockOnFilterChange} />)
    
    const protanopiaBtn = screen.getByText('Protanopia').closest('button')
    await userEvent.click(protanopiaBtn)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith('protanopia')
  })
  
  it('shows active state for selected filter', () => {
    render(<ImpairmentControls activeFilter="deuteranopia" onFilterChange={mockOnFilterChange} />)
    
    const deuteranopiaBtn = screen.getByText('Deuteranopia').closest('button')
    expect(deuteranopiaBtn).toHaveClass('active')
    expect(deuteranopiaBtn).toHaveAttribute('aria-pressed', 'true')
  })
  
  it('does not show active state for non-selected filters', () => {
    render(<ImpairmentControls activeFilter="deuteranopia" onFilterChange={mockOnFilterChange} />)
    
    const protanopiaBtn = screen.getByText('Protanopia').closest('button')
    expect(protanopiaBtn).not.toHaveClass('active')
    expect(protanopiaBtn).toHaveAttribute('aria-pressed', 'false')
  })
  
  it('toggles filter off when clicking active filter', async () => {
    render(<ImpairmentControls activeFilter="protanopia" onFilterChange={mockOnFilterChange} />)
    
    const protanopiaBtn = screen.getByText('Protanopia').closest('button')
    await userEvent.click(protanopiaBtn)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith('none')
  })
  
  it('shows clear button when filter is active', () => {
    render(<ImpairmentControls activeFilter="protanopia" onFilterChange={mockOnFilterChange} />)
    
    expect(screen.getByRole('button', { name: /clear active filter/i })).toBeInTheDocument()
  })
  
  it('hides clear button when no filter is active', () => {
    render(<ImpairmentControls activeFilter="none" onFilterChange={mockOnFilterChange} />)
    
    expect(screen.queryByRole('button', { name: /clear active filter/i })).not.toBeInTheDocument()
  })
  
  it('clears filter when clear button is clicked', async () => {
    render(<ImpairmentControls activeFilter="cataracts" onFilterChange={mockOnFilterChange} />)
    
    const clearBtn = screen.getByRole('button', { name: /clear active filter/i })
    await userEvent.click(clearBtn)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith('none')
  })
  
  it('displays prevalence information for each filter', () => {
    render(<ImpairmentControls onFilterChange={mockOnFilterChange} />)
    
    // Check that prevalence info is displayed
    expect(screen.getByText(/~1% of males/i)).toBeInTheDocument()
    expect(screen.getByText(/~50% over age 80/i)).toBeInTheDocument()
  })
  
  it('has accessible button titles with descriptions', () => {
    render(<ImpairmentControls onFilterChange={mockOnFilterChange} />)
    
    const protanopiaBtn = screen.getByText('Protanopia').closest('button')
    expect(protanopiaBtn).toHaveAttribute('title')
    expect(protanopiaBtn.getAttribute('title')).toContain('red')
  })
  
  it('has proper ARIA attributes', () => {
    render(<ImpairmentControls activeFilter="none" onFilterChange={mockOnFilterChange} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      if (!button.getAttribute('aria-label')?.includes('Clear')) {
        expect(button).toHaveAttribute('aria-pressed')
      }
    })
  })
})

