'use client'

import styled from 'styled-components'
import Link from 'next/link'

export const Container = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--gutter-mobile);

  @media (min-width: 1024px) {
    padding: 0 var(--gutter-desktop);
  }
  @media (max-width: 600px) {
    padding: 0 20px;
  }
  @media (max-width: 380px) {
    padding: 0 16px;
  }
`

export const Section = styled.section`
  padding: var(--space-section) 0;
`

export const SectionSage = styled(Section)`
  background: var(--color-sage-tint);
`

export const MicroLabel = styled.p<{ $onDark?: boolean }>`
  font-size: 12.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${(p) => (p.$onDark ? 'var(--color-sage)' : 'var(--color-green)')};
  margin: 0;
`

const buttonBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 30px;
  border-radius: var(--radius);
  font-weight: 700;
  font-size: 15px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 200ms ease;
`

export const ButtonLink = styled(Link)<{ $variant?: 'outline' }>`
  ${buttonBase}
  background: ${(p) => (p.$variant === 'outline' ? 'transparent' : 'var(--color-green)')};
  color: ${(p) => (p.$variant === 'outline' ? 'var(--color-green)' : 'var(--color-white)')};
  border: ${(p) => (p.$variant === 'outline' ? '1.5px solid var(--color-green)' : 'none')};

  &:hover {
    background: ${(p) => (p.$variant === 'outline' ? 'var(--color-sage-tint)' : 'var(--color-green-hover)')};
    transform: ${(p) => (p.$variant === 'outline' ? 'none' : 'scale(1.02)')};
  }
`

export const ButtonEl = styled.button`
  ${buttonBase}
  background: var(--color-green);
  color: var(--color-white);
  width: 100%;

  &:hover {
    background: var(--color-green-hover);
    transform: scale(1.02);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const LinkCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-green);
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;

  svg {
    transition: transform 200ms ease;
  }
  &:hover svg {
    transform: translateX(4px);
  }
`

const pillBase = `
  width: 100%;
  padding: 16px 20px;
  border: 1.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 14px;
  font-size: 16px;
  font-family: var(--font-family);
  background: white;
  color: var(--color-black);

  &:focus {
    outline: none;
    border-color: var(--color-green);
  }
`

export const PillInput = styled.input`
  ${pillBase}
`
export const PillSelect = styled.select`
  ${pillBase}
`
export const PillTextarea = styled.textarea`
  ${pillBase}
  resize: vertical;
`

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 32px 0;
`

export const ProductCard = styled.div`
  background: var(--color-white);
  border-radius: var(--product-radius);
  padding: 32px;
  display: flex;
  flex-direction: column;
  flex: 0 0 400px;
  height: 500px;
  scroll-snap-align: start;

  @media (max-width: 480px) {
    flex: 0 0 70vw;
    height: 440px;
  }
`

export const ProductCardTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 12px;
  color: var(--color-black);
`

export const ProductCardImage = styled.div`
  position: relative;
  flex: 1;
  min-height: 200px;
  border-radius: calc(var(--radius) - 2px);
  overflow: hidden;
  background: var(--color-sage-tint);
`

export const ArrowOverlayButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-green);
  cursor: pointer;
  transition: transform 200ms ease, background 200ms ease;
  z-index: 2;

  &:hover {
    background: var(--color-green);
    color: white;
    transform: translate(2px, -2px);
  }
`

export const CarouselTrack = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 480px) {
    gap: 12px;
  }
`

export const CarouselControls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
`

export const ScrollButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-black);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`

export const CategoryTabsWrap = styled.div`
  display: flex;
  gap: 28px;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 16px;
  margin-bottom: 56px;

  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 480px) {
    gap: 20px;
  }
`

export const CategoryTab = styled.a`
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text-muted);
  text-decoration: none;
  white-space: nowrap;
  padding-bottom: 6px;
  border-bottom: 2px solid transparent;

  &:hover {
    color: var(--color-black);
  }
`

export const ValueCard = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: var(--color-white);
  border-left: 3px solid var(--color-sage);
  padding: 24px;
`

export const ValueNum = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-green);
  letter-spacing: 0.04em;
`

export const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1fr);
  gap: 56px;
  align-items: start;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`

export const DetailSticky = styled.div`
  position: sticky;
  top: 100px;

  @media (max-width: 900px) {
    position: static;
  }
`

export const Accordion = styled.details`
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 0;

  summary {
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: '+';
    font-size: 20px;
    font-weight: 400;
    color: var(--color-green);
  }
  &[open] summary::after {
    content: '\\2212';
  }
`

export const AccordionBody = styled.div`
  padding-top: 14px;
  font-size: 15px;
  color: var(--color-text-muted);
`

export const CalcEmptyNote = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  padding: 20px 0;
`

export const PdpInfoRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 20px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin: 24px 0;
`

export const PdpInfoIcon = styled.span`
  flex-shrink: 0;
  color: var(--color-green);
  margin-top: 2px;
`

export const PdpThumbStrip = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`

export const PdpThumb = styled.div<{ $active?: boolean }>`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${(p) => (p.$active ? 'var(--color-green)' : 'transparent')};
`

export const QuoteItemRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 420px) {
    flex-wrap: wrap;
    select {
      flex: 1 1 100%;
    }
  }
`

export const QvBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

export const QvModal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 960px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`

export const QvClose = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
`

export const QvTabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 20px 24px 0;
  &::-webkit-scrollbar {
    display: none;
  }
`

export const QvTab = styled.button<{ $active?: boolean }>`
  padding: 10px 18px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid ${(p) => (p.$active ? 'var(--color-black)' : 'rgba(0,0,0,0.12)')};
  background: ${(p) => (p.$active ? 'var(--color-black)' : 'white')};
  color: ${(p) => (p.$active ? 'white' : 'var(--color-black)')};
  cursor: pointer;
`

export const QvBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 24px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

export const QvImage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  background: var(--color-sage-tint);
  border-radius: var(--radius);
  overflow: hidden;
`

export const QvFeatureRow = styled.div`
  display: flex;
  gap: 14px;
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`

export const QvFeatureIcon = styled.span`
  flex-shrink: 0;
  width: 24px;
  color: var(--color-green);
`

export const QvFeatureText = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--color-black);
`
