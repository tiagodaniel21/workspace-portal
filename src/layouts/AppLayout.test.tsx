// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from './AppLayout'

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { email: 'teste@workspace.local' }, signOut: vi.fn() }) }))
vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }))
afterEach(cleanup)

function renderLayout() {
  return render(<MemoryRouter initialEntries={['/dashboard']}><Routes><Route element={<AppLayout />}><Route path="/dashboard" element={<div>Painel</div>} /><Route path="/tarefas" element={<div>Tarefas</div>} /></Route></Routes></MemoryRouter>)
}

describe('menu móvel', () => {
  it('abre pelo botão e fecha pelo botão interno', () => {
    const { container } = renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(container.querySelector('#main-sidebar')).toHaveClass('open')
    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar menu' })[0])
    expect(container.querySelector('#main-sidebar')).not.toHaveClass('open')
  })

  it('fecha pelo fundo e pela tecla Escape', () => {
    const { container } = renderLayout()
    const open = screen.getByRole('button', { name: 'Abrir menu' })
    fireEvent.click(open)
    fireEvent.click(container.querySelector('.nav-backdrop')!)
    expect(container.querySelector('#main-sidebar')).not.toHaveClass('open')
    fireEvent.click(open)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('#main-sidebar')).not.toHaveClass('open')
  })

  it('fecha ao navegar', () => {
    const { container } = renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    fireEvent.click(screen.getByRole('link', { name: 'Tarefas' }))
    expect(container.querySelector('#main-sidebar')).not.toHaveClass('open')
  })
})
