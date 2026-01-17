# 08 - Responsywność i Mobile-First Design

## Filozofia Designu

Aplikacja **Asystent Prawny AI** została zaprojektowana z podejściem **Mobile-First**, zapewniając doskonałe doświadczenie użytkownika na wszystkich urządzeniach.

## Breakpointy Tailwind CSS

```css
/* Tailwind Default Breakpoints */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

## Strategia Responsywności

### 1. Grid Layouts - Adaptacyjne Kolumny

#### Kafelki Wyboru (LawSelector, InteractionModeSelector)

**Mobile (< 768px):**
- 2 kolumny dla lepszego wykorzystania przestrzeni
- Zmniejszone paddingi i czcionki
- Kompaktowe ikony

**Tablet (≥ 768px):**
- 2 kolumny z większymi odstępami
- Standardowe rozmiary elementów

**Desktop (≥ 1024px):**
- 4 kolumny dla obszarów prawa
- 2 kolumny dla trybów interakcji
- Pełne rozmiary i odstępy

```tsx
// Przykład: LawSelector.tsx
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
  {/* 2 kolumny mobile, 2 tablet, 4 desktop */}
</div>
```

### 2. Responsywne Komponenty

#### Padding i Spacing

```tsx
// Mobile: mniejsze paddingi
// Desktop: większe paddingi dla komfortu
className="p-3 md:p-6"
className="gap-3 md:gap-6"
className="mb-2 md:mb-4"
```

#### Ikony

```tsx
// Mobile: 8x8 (32px)
// Desktop: 12x12 (48px)
className="w-8 h-8 md:w-12 md:h-12"
```

#### Typografia

```tsx
// Mobile: text-sm (14px)
// Desktop: text-xl (20px)
className="text-sm md:text-xl"

// Mobile: text-xs (12px)
// Desktop: text-base (16px)
className="text-xs md:text-base"
```

### 3. Ograniczanie Tekstu

```tsx
// Zapobiega przepełnieniu - max 2 linie
className="line-clamp-2"

// Zapobiega przepełnieniu - max 3 linie
className="line-clamp-3"
```

## Zoptymalizowane Komponenty

### LawSelector.tsx
**Optymalizacje:**
- Grid: `grid-cols-2` → `md:grid-cols-2` → `lg:grid-cols-4`
- Padding: `p-3` → `md:p-6`
- Ikony: `w-8 h-8` → `md:w-12 md:h-12`
- Tytuły: `text-sm` → `md:text-xl`
- Opisy: `text-xs` → `md:text-base` + `line-clamp-2`

**Rezultat:**
- 8 obszarów prawa widocznych bez przewijania na mobile
- Kompaktowy, ale czytelny układ

### InteractionModeSelector.tsx
**Optymalizacje:**
- Grid: `grid-cols-2` → `md:grid-cols-2`
- Padding: `p-3` → `md:p-6`
- Ikony: `w-8 h-8` → `md:w-12 md:h-12`
- Tytuły: `text-sm` → `md:text-xl`
- Opisy: `text-xs` → `md:text-sm` + `line-clamp-2`

**Rezultat:**
- 8 trybów interakcji widocznych bez przewijania
- Zachowana czytelność opisów

### LegalFAQ.tsx
**Optymalizacje:**
- Grid: `grid-cols-2` → `md:grid-cols-2`
- Padding: `p-3` → `md:p-4`

**Rezultat:**
- 4 pytania FAQ w 2 kolumnach
- Mniej przewijania

### CourtRoleSelector.tsx
**Optymalizacje:**
- Grid: `grid-cols-2` → `md:grid-cols-2`
- Padding: `p-3` → `md:p-6`
- Gap: `gap-2` → `md:gap-4`

**Rezultat:**
- 4 role sądowe w kompaktowym układzie

## Mobile Toolbar (ChatFooter)

### Adaptacyjny Pasek Narzędzi

**Funkcje:**
- Przycisk "3 kropki" do rozwijania/zwijania
- Ukrywanie elementów gdy zwinięty
- Minimalistyczny design

```tsx
// Zwinięty: tylko input i przycisk wyślij
<div className={isCollapsed ? 'hidden' : 'flex'}>
  <QuickActionsButton />
  <ContextBadge />
</div>

// Przycisk toggle
<button className="md:hidden">
  <DotsVerticalIcon className="w-5 h-5" />
</button>
```

**Padding:**
- Zwinięty: `py-0.5 px-2`
- Rozwinięty: `py-2 px-4`

## Chat Interface

### Responsywne Bąbelki Wiadomości

```tsx
// ChatBubble.tsx
<div className="max-w-full md:max-w-3xl">
  <div className="p-3 md:p-4">
    {/* Treść wiadomości */}
  </div>
</div>
```

### Adaptacyjne Przyciski Akcji

```tsx
// Mobile: ikony bez tekstu
// Desktop: ikony + tekst
<button className="flex items-center gap-2">
  <CopyIcon className="w-4 h-4" />
  <span className="hidden md:inline">Kopiuj</span>
</button>
```

## Modals i Overlays

### Pełnoekranowe na Mobile

```tsx
// Mobile: pełny ekran
// Desktop: centrowany modal
<div className="fixed inset-0 md:inset-auto md:max-w-2xl">
  {/* Zawartość modala */}
</div>
```

### Backdrop Blur

```tsx
// Efekt szkła (glassmorphism)
className="backdrop-blur-sm bg-slate-900/80"
```

## Formularze

### Responsywne Layouty

```tsx
// Mobile: pionowy stack
// Desktop: poziomy flex
<div className="flex flex-col md:flex-row gap-3">
  <input className="flex-grow" />
  <button className="w-full md:w-auto">Wyślij</button>
</div>
```

## Nawigacja

### Hamburger Menu (Mobile)

```tsx
// Widoczny tylko na mobile
<button className="md:hidden">
  <MenuIcon className="w-6 h-6" />
</button>

// Ukryty na mobile, widoczny na desktop
<nav className="hidden md:flex">
  {/* Linki nawigacyjne */}
</nav>
```

## Testowanie Responsywności

### Chrome DevTools
1. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Testuj na:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

### Checklist
- [ ] Wszystkie kafelki są czytelne na mobile
- [ ] Nie ma poziomego scrollowania
- [ ] Przyciski są łatwe do kliknięcia (min 44x44px)
- [ ] Tekst jest czytelny (min 14px na mobile)
- [ ] Formularze są wygodne w użyciu
- [ ] Modals nie blokują zawartości
- [ ] Nawigacja działa płynnie

## Najlepsze Praktyki

### 1. Touch Targets
```tsx
// Minimum 44x44px dla elementów interaktywnych
className="p-3 min-h-[44px] min-w-[44px]"
```

### 2. Readable Text
```tsx
// Minimum 14px (text-sm) na mobile
className="text-sm md:text-base"
```

### 3. Spacing
```tsx
// Mniejsze odstępy na mobile
className="space-y-3 md:space-y-6"
```

### 4. Flex Direction
```tsx
// Pionowy na mobile, poziomy na desktop
className="flex flex-col md:flex-row"
```

### 5. Hidden Elements
```tsx
// Ukryj na mobile
className="hidden md:block"

// Ukryj na desktop
className="md:hidden"
```

## Performance

### Lazy Loading Images
```tsx
<img loading="lazy" src="..." alt="..." />
```

### Conditional Rendering
```tsx
// Renderuj tylko na odpowiednim urządzeniu
{isMobile ? <MobileComponent /> : <DesktopComponent />}
```

### CSS Containment
```tsx
// Optymalizacja renderowania
className="contain-layout contain-paint"
```

## Accessibility (a11y)

### Semantic HTML
```tsx
<nav>, <main>, <article>, <section>
```

### ARIA Labels
```tsx
<button aria-label="Zamknij modal">
  <XIcon />
</button>
```

### Focus Management
```tsx
// Widoczny focus ring
className="focus:outline-none focus:ring-2 focus:ring-cyan-500"
```

## Metryki Sukcesu

### Przed Optymalizacją (Mobile)
- Przewijanie: ~3-4 ekrany dla 8 kafelków
- Czytelność: średnia (małe czcionki)
- UX: przeciętne

### Po Optymalizacji (Mobile)
- Przewijanie: ~1-2 ekrany dla 8 kafelków ✅
- Czytelność: wysoka (responsywne czcionki) ✅
- UX: doskonałe (kompaktowy, ale czytelny) ✅

---
*Senior Full Stack Developer*
*Ostatnia aktualizacja: Styczeń 2026*
