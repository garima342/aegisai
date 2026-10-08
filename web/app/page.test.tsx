import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from './page'

test('Home page renders', () => {
  render(<Page />)
  expect(screen.getByText('Dashboard')).toBeDefined()
})
