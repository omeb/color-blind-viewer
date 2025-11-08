import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HistorySection from './HistorySection'

describe('HistorySection', () => {
  const mockHistory = ['example.com', 'test.com', 'demo.com']
  const mockOnSelectUrl = jest.fn()
  const mockOnRemoveUrl = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when history is empty', () => {
    const { container } = render(
      <HistorySection
        history={[]}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders history items', () => {
    render(
      <HistorySection
        history={mockHistory}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )

    expect(screen.getByText('Recent Sites')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
    expect(screen.getByText('test.com')).toBeInTheDocument()
    expect(screen.getByText('demo.com')).toBeInTheDocument()
  })

  it('calls onSelectUrl when a history item is clicked', () => {
    render(
      <HistorySection
        history={mockHistory}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )

    const firstItem = screen.getByTitle('Load example.com')
    fireEvent.click(firstItem)

    expect(mockOnSelectUrl).toHaveBeenCalledWith('example.com')
    expect(mockOnSelectUrl).toHaveBeenCalledTimes(1)
  })

  it('calls onRemoveUrl when remove button is clicked', () => {
    render(
      <HistorySection
        history={mockHistory}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )

    const removeButton = screen.getByLabelText('Remove example.com from history')
    fireEvent.click(removeButton)

    expect(mockOnRemoveUrl).toHaveBeenCalledWith('example.com')
    expect(mockOnRemoveUrl).toHaveBeenCalledTimes(1)
    expect(mockOnSelectUrl).not.toHaveBeenCalled()
  })

  it('renders with globe icons for each item', () => {
    render(
      <HistorySection
        history={mockHistory}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )

    const icons = screen.getAllByText('🌐')
    expect(icons).toHaveLength(mockHistory.length)
  })

  it('renders remove buttons for each item', () => {
    render(
      <HistorySection
        history={mockHistory}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )

    const removeButtons = screen.getAllByText('✕')
    expect(removeButtons).toHaveLength(mockHistory.length)
  })

  it('has correct accessibility labels', () => {
    render(
      <HistorySection
        history={['example.com']}
        onSelectUrl={mockOnSelectUrl}
        onRemoveUrl={mockOnRemoveUrl}
      />
    )

    expect(screen.getByTitle('Load example.com')).toBeInTheDocument()
    expect(screen.getByLabelText('Remove example.com from history')).toBeInTheDocument()
  })
})


