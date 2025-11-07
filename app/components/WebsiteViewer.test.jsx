import { render, screen } from '@testing-library/react'
import WebsiteViewer from './WebsiteViewer'

describe('WebsiteViewer', () => {
  it('shows empty state when no URL is provided', () => {
    render(<WebsiteViewer />)
    
    expect(screen.getByText(/enter a website url/i)).toBeInTheDocument()
  })
  
  it('shows loading state', () => {
    render(<WebsiteViewer loading={true} />)
    
    expect(screen.getByText(/loading website/i)).toBeInTheDocument()
  })
  
  it('shows error state with message', () => {
    render(<WebsiteViewer error="Network error" />)
    
    expect(screen.getByText(/failed to load website/i)).toBeInTheDocument()
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })
  
  it('renders iframe when URL is provided', () => {
    render(<WebsiteViewer url="https://example.com" />)
    
    const iframe = screen.getByTitle(/website preview/i)
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', '/api/proxy?url=https%3A%2F%2Fexample.com')
  })
  
  it('encodes URL properly for proxy', () => {
    const url = 'https://example.com/page?param=value&other=test'
    render(<WebsiteViewer url={url} />)
    
    const iframe = screen.getByTitle(/website preview/i)
    expect(iframe).toHaveAttribute('src', expect.stringContaining('/api/proxy?url='))
    expect(iframe.getAttribute('src')).toContain(encodeURIComponent(url))
  })
  
  it('applies no filter by default', () => {
    const { container } = render(<WebsiteViewer url="https://example.com" />)
    
    const wrapper = container.querySelector('.iframe-wrapper')
    expect(wrapper).not.toHaveClass('filtered')
  })
  
  it('applies filter class when filter is active', () => {
    const { container } = render(
      <WebsiteViewer url="https://example.com" activeFilter="protanopia" />
    )
    
    const wrapper = container.querySelector('.iframe-wrapper')
    expect(wrapper).toHaveClass('filtered')
  })
  
  it('has appropriate sandbox attributes', () => {
    render(<WebsiteViewer url="https://example.com" />)
    
    const iframe = screen.getByTitle(/website preview/i)
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms')
  })
  
  it('has accessible title attribute', () => {
    render(<WebsiteViewer url="https://example.com" />)
    
    const iframe = screen.getByTitle(/website preview with vision impairment filter/i)
    expect(iframe).toBeInTheDocument()
  })
  
  it('error message has alert role', () => {
    render(<WebsiteViewer error="Test error" />)
    
    const errorState = screen.getByRole('alert')
    expect(errorState).toBeInTheDocument()
  })
  
  it('does not render iframe when loading', () => {
    render(<WebsiteViewer url="https://example.com" loading={true} />)
    
    expect(screen.queryByTitle(/website preview/i)).not.toBeInTheDocument()
  })
  
  it('does not render iframe when error', () => {
    render(<WebsiteViewer url="https://example.com" error="Error message" />)
    
    expect(screen.queryByTitle(/website preview/i)).not.toBeInTheDocument()
  })
})

