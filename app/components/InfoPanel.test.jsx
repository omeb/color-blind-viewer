import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InfoPanel from './InfoPanel'

describe('InfoPanel', () => {
  it('renders panel title', () => {
    render(<InfoPanel />)
    
    expect(screen.getByText('About Vision Impairments')).toBeInTheDocument()
  })
  
  it('is expanded by default', () => {
    render(<InfoPanel />)
    
    const toggle = screen.getByRole('button', { name: /about vision impairments/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/why this matters/i)).toBeInTheDocument()
  })
  
  it('can be collapsed', async () => {
    render(<InfoPanel />)
    
    const toggle = screen.getByRole('button', { name: /about vision impairments/i })
    await userEvent.click(toggle)
    
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/why this matters/i)).not.toBeInTheDocument()
  })
  
  it('can be re-expanded', async () => {
    render(<InfoPanel />)
    
    const toggle = screen.getByRole('button', { name: /about vision impairments/i })
    
    // Collapse
    await userEvent.click(toggle)
    expect(screen.queryByText(/why this matters/i)).not.toBeInTheDocument()
    
    // Expand again
    await userEvent.click(toggle)
    expect(screen.getByText(/why this matters/i)).toBeInTheDocument()
  })
  
  it('shows general info when no filter is active', () => {
    render(<InfoPanel activeFilter="none" />)
    
    expect(screen.getByText(/why this matters/i)).toBeInTheDocument()
    expect(screen.getByText(/quick facts/i)).toBeInTheDocument()
    expect(screen.getByText(/design tips/i)).toBeInTheDocument()
  })
  
  it('shows filter-specific info when filter is active', () => {
    render(<InfoPanel activeFilter="protanopia" />)
    
    expect(screen.getByText('Protanopia')).toBeInTheDocument()
    expect(screen.getByText(/red-blind/i)).toBeInTheDocument()
    expect(screen.getByText('Prevalence:')).toBeInTheDocument()
  })
  
  it('displays different info for different filters', () => {
    const { rerender } = render(<InfoPanel activeFilter="deuteranopia" />)
    expect(screen.getByText('Deuteranopia')).toBeInTheDocument()
    
    rerender(<InfoPanel activeFilter="cataracts" />)
    expect(screen.getByText('Cataracts')).toBeInTheDocument()
  })
  
  it('shows quick facts section', () => {
    render(<InfoPanel />)
    
    expect(screen.getByText(/300 million/i)).toBeInTheDocument()
    expect(screen.getByText(/1 in 12 males/i)).toBeInTheDocument()
    expect(screen.getByText(/2.2 billion/i)).toBeInTheDocument()
  })
  
  it('shows design tips', () => {
    render(<InfoPanel />)
    
    expect(screen.getByText(/sufficient color contrast/i)).toBeInTheDocument()
    expect(screen.getByText(/don't rely on color alone/i)).toBeInTheDocument()
  })
  
  it('includes WCAG link', () => {
    render(<InfoPanel />)
    
    const link = screen.getByRole('link', { name: /wcag guidelines/i })
    expect(link).toHaveAttribute('href', 'https://www.w3.org/WAI/WCAG21/quickref/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
  
  it('has proper ARIA attributes for collapsible section', () => {
    render(<InfoPanel />)
    
    const toggle = screen.getByRole('button', { name: /about vision impairments/i })
    expect(toggle).toHaveAttribute('aria-expanded')
    expect(toggle).toHaveAttribute('aria-controls', 'panel-content')
  })
  
  it('displays severity information when available', () => {
    render(<InfoPanel activeFilter="protanopia" />)
    
    expect(screen.getByText('Severity:')).toBeInTheDocument()
    expect(screen.getByText('Severe')).toBeInTheDocument()
  })
  
  it('toggles icon changes when expanding/collapsing', async () => {
    render(<InfoPanel />)
    
    const toggle = screen.getByRole('button', { name: /about vision impairments/i })
    
    // Initially expanded (shows minus)
    expect(toggle).toHaveTextContent('−')
    
    // Click to collapse (shows plus)
    await userEvent.click(toggle)
    expect(toggle).toHaveTextContent('+')
    
    // Click to expand again (shows minus)
    await userEvent.click(toggle)
    expect(toggle).toHaveTextContent('−')
  })
})

