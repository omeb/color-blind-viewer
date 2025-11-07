import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  
  describe('URL Editing', () => {
    it('shows clickable URL display after iframe loads', async () => {
      render(<WebsiteViewer url="https://example.com" />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      expect(urlDisplay).toBeInTheDocument()
    })
    
    it('switches to edit mode when URL is clicked', async () => {
      render(<WebsiteViewer url="https://example.com" onUrlChange={jest.fn()} />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      // Click on URL
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      fireEvent.click(urlDisplay)
      
      // Should show input field
      await waitFor(() => {
        expect(screen.getByLabelText(/edit website url/i)).toBeInTheDocument()
      })
    })
    
    it('focuses and selects input text when edit mode is activated', async () => {
      render(<WebsiteViewer url="https://example.com" onUrlChange={jest.fn()} />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      // Click on URL
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      fireEvent.click(urlDisplay)
      
      // Input should be focused
      await waitFor(() => {
        const input = screen.getByLabelText(/edit website url/i)
        expect(input).toHaveFocus()
      })
    })
    
    it('calls onUrlChange with formatted URL on submit', async () => {
      const onUrlChange = jest.fn()
      render(<WebsiteViewer url="https://example.com" onUrlChange={onUrlChange} />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      // Click on URL
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      fireEvent.click(urlDisplay)
      
      // Edit URL
      const input = await screen.findByLabelText(/edit website url/i)
      await userEvent.clear(input)
      await userEvent.type(input, 'github.com')
      
      // Submit
      const submitBtn = screen.getByRole('button', { name: /apply url change/i })
      fireEvent.click(submitBtn)
      
      expect(onUrlChange).toHaveBeenCalledWith('https://github.com')
    })
    
    it('cancels edit mode when cancel button is clicked', async () => {
      render(<WebsiteViewer url="https://example.com" onUrlChange={jest.fn()} />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      // Click on URL
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      fireEvent.click(urlDisplay)
      
      // Edit URL
      const input = await screen.findByLabelText(/edit website url/i)
      await userEvent.clear(input)
      await userEvent.type(input, 'github.com')
      
      // Cancel
      const cancelBtn = screen.getByRole('button', { name: /cancel url change/i })
      fireEvent.click(cancelBtn)
      
      // Should be back to display mode with original URL
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
        expect(screen.queryByLabelText(/edit website url/i)).not.toBeInTheDocument()
      })
    })
    
    it('cancels edit mode when Escape key is pressed', async () => {
      render(<WebsiteViewer url="https://example.com" onUrlChange={jest.fn()} />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      // Click on URL
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      fireEvent.click(urlDisplay)
      
      // Edit URL
      const input = await screen.findByLabelText(/edit website url/i)
      await userEvent.clear(input)
      await userEvent.type(input, 'github.com')
      
      // Press Escape
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })
      
      // Should be back to display mode with original URL
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
        expect(screen.queryByLabelText(/edit website url/i)).not.toBeInTheDocument()
      })
    })
    
    it('formats URL by adding https:// prefix', async () => {
      const onUrlChange = jest.fn()
      render(<WebsiteViewer url="https://example.com" onUrlChange={onUrlChange} />)
      
      // Wait for iframe to load
      const iframe = screen.getByTitle(/website preview/i)
      fireEvent.load(iframe)
      
      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
      })
      
      // Click on URL
      const urlDisplay = screen.getByRole('button', { name: /click to edit url/i })
      fireEvent.click(urlDisplay)
      
      // Edit URL without protocol
      const input = await screen.findByLabelText(/edit website url/i)
      await userEvent.clear(input)
      await userEvent.type(input, 'wix.com')
      
      // Submit
      const submitBtn = screen.getByRole('button', { name: /apply url change/i })
      fireEvent.click(submitBtn)
      
      expect(onUrlChange).toHaveBeenCalledWith('https://wix.com')
    })
  })
})

