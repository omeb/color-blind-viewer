import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlInput from './UrlInput'

describe('UrlInput', () => {
  const mockOnSubmit = jest.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })
  
  it('renders input and button', () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load website/i })).toBeInTheDocument()
  })
  
  it('disables button when input is empty', () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const button = screen.getByRole('button', { name: /load website/i })
    expect(button).toBeDisabled()
  })
  
  it('enables button when input has value', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'example.com')
    
    const button = screen.getByRole('button', { name: /load website/i })
    expect(button).not.toBeDisabled()
  })
  
  it('calls onSubmit with formatted URL when form is submitted', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'example.com')
    
    const button = screen.getByRole('button', { name: /load website/i })
    await userEvent.click(button)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com')
  })
  
  it('preserves https:// prefix if provided', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'https://example.com')
    
    const button = screen.getByRole('button', { name: /load website/i })
    await userEvent.click(button)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('https://example.com')
  })
  
  it('preserves http:// prefix if provided', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'http://example.com')
    
    const button = screen.getByRole('button', { name: /load website/i })
    await userEvent.click(button)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('http://example.com')
  })
  
  it('shows error for invalid URL', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'not a valid url')
    
    const button = screen.getByRole('button', { name: /load website/i })
    await userEvent.click(button)
    
    expect(screen.getByRole('alert')).toHaveTextContent(/valid website url/i)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
  
  it('shows error when submitting empty form', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    // Type and then clear
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'test')
    await userEvent.clear(input)
    
    // Form submission should show error
    const form = input.closest('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/enter a website url/i)
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
  
  it('clears error when user types after error', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /load website/i })
    
    // Trigger error
    await userEvent.type(input, 'invalid')
    await userEvent.click(button)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    
    // Type again
    await userEvent.type(input, ' text')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  
  it('shows loading state', () => {
    render(<UrlInput onSubmit={mockOnSubmit} loading={true} />)
    
    const input = screen.getByLabelText(/website url/i)
    const button = screen.getByRole('button', { name: /loading website/i })
    
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/loading/i)
  })
  
  it('has accessible attributes', () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    expect(input).toHaveAttribute('type', 'url')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })
  
  it('sets aria-invalid when error is shown', async () => {
    render(<UrlInput onSubmit={mockOnSubmit} />)
    
    const input = screen.getByLabelText(/website url/i)
    await userEvent.type(input, 'invalid')
    
    const button = screen.getByRole('button', { name: /load website/i })
    await userEvent.click(button)
    
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'url-error')
  })
})

