import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { Badge, StatusBadge } from './Badge.jsx'
import { Button } from './Button.jsx'
import { ConfirmDialog } from './ConfirmDialog.jsx'
import { DataTable } from './DataTable.jsx'
import { Field, TextField } from './fields.jsx'
import { Meter } from './Meter.jsx'
import { Modal } from './Modal.jsx'
import { Pagination } from './Pagination.jsx'
import { SegmentedControl } from './SegmentedControl.jsx'

describe('Button', () => {
  it('is a plain button unless told to submit', () => {
    render(<Button>Go</Button>)
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button')
    render(<Button submit>Send</Button>)
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit')
  })

  it('cannot be clicked while loading', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button', { name: /save/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('badges', () => {
  it('maps a status to its readable label and tone', () => {
    render(<StatusBadge kind="health" value="DOWN" />)
    const badge = screen.getByText('Down')
    expect(badge.className).toMatch(/danger/)
  })

  it('falls back to a humanised label for a value it has no text for', () => {
    render(<StatusBadge kind="health" value="SOMETHING_NEW" />)
    expect(screen.getByText('Something new')).toBeInTheDocument()
  })

  it('merges extra classes', () => {
    render(<Badge tone="success" className="mt-2">ok</Badge>)
    expect(screen.getByText('ok').className).toMatch(/mt-2/)
  })
})

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name', cell: (row) => row.name },
    { key: 'extra', header: 'Extra', hideBelow: 'md', cell: (row) => row.extra },
  ]

  it('renders a row per item with headers', () => {
    render(<DataTable columns={columns} rows={[{ id: 1, name: 'Alpha', extra: 'x' }, { id: 2, name: 'Beta', extra: 'y' }]} />)
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('hides a column on small screens with a responsive class', () => {
    render(<DataTable columns={columns} rows={[{ id: 1, name: 'Alpha', extra: 'x' }]} />)
    expect(screen.getByRole('columnheader', { name: 'Extra' }).className).toMatch(/hidden md:table-cell/)
  })

  it('shows placeholders while loading and the empty state when there are no rows', () => {
    const { container, rerender } = render(<DataTable columns={columns} rows={[]} loading />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5)
    rerender(<DataTable columns={columns} rows={[]} empty={<p>Nothing here</p>} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('Pagination', () => {
  it('summarises the range and moves between pages', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} pages={3} total={45} pageSize={20} onPageChange={onPageChange} />)
    expect(screen.getByText(/21.*40.*45/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('disables the ends and hides itself when there is nothing to page', () => {
    const { rerender } = render(<Pagination page={1} pages={2} total={30} pageSize={20} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    rerender(<Pagination page={1} pages={1} total={0} pageSize={20} onPageChange={() => {}} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})

describe('Modal and ConfirmDialog', () => {
  it('shows its content only while open', () => {
    const { rerender } = render(<Modal open={false} onClose={() => {}} title="Hello"><p>Body</p></Modal>)
    expect(screen.queryByText('Body')).not.toBeInTheDocument()
    rerender(<Modal open onClose={() => {}} title="Hello"><p>Body</p></Modal>)
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Hello' })).toBeInTheDocument()
  })

  it('closes from the close button', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Hello">x</Modal>)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not offer to close while an action is running', () => {
    render(<ConfirmDialog open title="Sure?" confirmLabel="Delete" loading onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('confirms and cancels', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Sure?" message="This is permanent" confirmLabel="Delete" onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByText('This is permanent')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })
})

describe('form fields', () => {
  it('links the label, hint and error to the input for screen readers', () => {
    render(<TextField label="Email" hint="We never share it" error="Enter a valid email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const described = input.getAttribute('aria-describedby')
    expect(described).toMatch(/error/)
    expect(document.getElementById(described.split(' ')[0])).toHaveTextContent('Enter a valid email')
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument() // the error replaces the hint
  })

  it('marks required fields', () => {
    render(<Field label="Name" required>{(aria) => <input {...aria} />}</Field>)
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})

describe('SegmentedControl', () => {
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]

  it('selects one option at a time', async () => {
    function Harness() {
      const [value, setValue] = useState('a')
      return <SegmentedControl label="Pick" options={options} value={value} onChange={setValue} />
    }
    render(<Harness />)
    expect(screen.getByLabelText('Alpha')).toBeChecked()
    await userEvent.click(screen.getByLabelText('Beta'))
    expect(screen.getByLabelText('Beta')).toBeChecked()
    expect(screen.getByLabelText('Alpha')).not.toBeChecked()
  })
})

describe('Meter', () => {
  it('shows usage and caps the bar at the limit', () => {
    render(<Meter label="Monitors" used={7} max={5} />)
    const bar = screen.getByRole('progressbar', { name: 'Monitors' })
    expect(bar).toHaveAttribute('max', '5')
    expect(bar).toHaveAttribute('value', '5')
    expect(screen.getByText(/7.*5/)).toBeInTheDocument()
    expect(bar.className).toMatch(/danger/)
  })

  it('warns as it nears the limit', () => {
    render(<Meter label="Seats" used={9} max={10} />)
    expect(screen.getByRole('progressbar').className).toMatch(/warning/)
  })
})

describe('layout helpers needing a router', () => {
  it('Modal inside a router still renders', () => {
    render(<MemoryRouter><Modal open onClose={() => {}} title="T"><Badge>x</Badge></Modal></MemoryRouter>)
    expect(within(screen.getByRole('dialog')).getByText('x')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
  })
})
