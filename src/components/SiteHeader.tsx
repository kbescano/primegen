'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styled from 'styled-components'
import { Container, ButtonLink } from '@/components/ui/styled'

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/about', label: 'About' },
]

const Header = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 14px 0;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(20, 49, 9, 0.15);
`

const Row = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`

const Wordmark = styled(Link)`
  font-weight: 700;
  font-size: 19px;
  color: var(--color-text-muted);
  text-decoration: none;
`

const Hamburger = styled.button`
  display: none;
  flex-direction: column;
  gap: 5px;
  width: 24px;
  height: 17px;
  background: none;
  border: none;
  cursor: pointer;

  span {
    display: block;
    height: 2px;
    width: 100%;
    background: #000000;
    border-radius: 2px;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  &.open span:nth-child(1) {
    transform: translateY(7.5px) rotate(45deg);
  }
  &.open span:nth-child(2) {
    opacity: 0;
  }
  &.open span:nth-child(3) {
    transform: translateY(-7.5px) rotate(-45deg);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 26px;

  @media (max-width: 768px) {
    display: none;
  }
`

const NavLinkItem = styled(Link)<{ $active?: boolean }>`
  position: relative;
  color: rgba(20, 49, 9, 0.85);
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  padding-bottom: 4px;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: ${(p) => (p.$active ? '100%' : '0')};
    height: 2px;
    background: var(--color-sage);
    transition: width 200ms ease;
  }
  &:hover::after {
    width: 100%;
  }
`

const MobilePanel = styled.div`
  display: none;

  @media (max-width: 768px) {
    &.open {
      display: flex;
      flex-direction: column;
      position: fixed;
      inset: 0;
      background: #ffffff;
      z-index: 999;
      padding: 28px 32px;
      overflow-y: auto;
    }
  }
`

const MnpClose = styled.button`
  align-self: flex-end;
  background: none;
  border: none;
  cursor: pointer;
  color: #000000;
  padding: 8px;
  margin-bottom: 24px;
`

const MnpRow = styled(Link)<{ $accent?: boolean }>`
  display: block;
  padding: 14px 0;
  font-size: 22px;
  font-weight: 700;
  color: ${(p) => (p.$accent ? 'var(--color-green)' : '#000000')};
  text-decoration: none;
`

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <Header>
      <Row>
        <Wordmark href="/" onClick={() => setOpen(false)}>
          Primegen Trading Corporation
        </Wordmark>

        <Hamburger
          className={open ? 'open' : ''}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </Hamburger>

        <DesktopNav>
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
              <NavLinkItem href={link.href} $active={pathname === link.href}>
                {link.label}
              </NavLinkItem>
            </span>
          ))}
          <ButtonLink href="/quote">Request a Quote</ButtonLink>
        </DesktopNav>

        <MobilePanel className={open ? 'open' : ''}>
          <MnpClose onClick={() => setOpen(false)} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </MnpClose>

          {NAV_LINKS.map((link) => (
            <MnpRow key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </MnpRow>
          ))}
          <MnpRow href="/quote" $accent onClick={() => setOpen(false)}>
            Request a Quote
          </MnpRow>
        </MobilePanel>
      </Row>
    </Header>
  )
}
