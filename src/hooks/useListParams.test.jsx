import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import { compactParams, useListParams } from './useListParams.js'

const DEFAULTS = { search: '', status: 'ACTIVE' }

function Harness() {
  const [params, setParams] = useListParams(DEFAULTS)
  const location = useLocation()
  return (
    <>
      <output data-testid="params">{JSON.stringify(params)}</output>
      <output data-testid="url">{location.search}</output>
      <button type="button" onClick={() => setParams({ page: 3 })}>page 3</button>
      <button type="button" onClick={() => setParams({ search: 'api' })}>search</button>
      <button type="button" onClick={() => setParams({ status: 'ACTIVE' })}>default status</button>
    </>
  )
}

const renderAt = (url) => render(<MemoryRouter initialEntries={[url]}><Harness /></MemoryRouter>)
const read = () => JSON.parse(screen.getByTestId('params').textContent)

describe('useListParams', () => {
  it('starts from the defaults, with page 1', () => {
    renderAt('/')
    expect(read()).toEqual({ search: '', status: 'ACTIVE', page: 1 })
  })

  it('reads filters from the address', () => {
    renderAt('/?search=prod&page=4')
    expect(read()).toMatchObject({ search: 'prod', page: 4 })
  })

  it('treats a nonsense page as page 1', () => {
    renderAt('/?page=banana')
    expect(read().page).toBe(1)
  })

  it('changing a filter returns to the first page', async () => {
    renderAt('/?page=3')
    await userEvent.click(screen.getByText('search'))
    expect(read()).toMatchObject({ search: 'api', page: 1 })
    expect(screen.getByTestId('url')).toHaveTextContent('search=api')
    expect(screen.getByTestId('url')).not.toHaveTextContent('page')
  })

  it('changing the page keeps the filters', async () => {
    renderAt('/?search=prod')
    await userEvent.click(screen.getByText('page 3'))
    expect(read()).toMatchObject({ search: 'prod', page: 3 })
  })

  it('keeps the address clean by dropping values equal to the default', async () => {
    renderAt('/?status=PAUSED')
    await userEvent.click(screen.getByText('default status'))
    expect(screen.getByTestId('url').textContent).toBe('')
  })
})

describe('compactParams', () => {
  it('drops empty values before they are sent to the API', () => {
    expect(compactParams({ a: '', b: null, c: undefined, d: 0, e: 'x' })).toEqual({ d: 0, e: 'x' })
  })
})
