# Mimesis Design System

## Color Palette

### Primary Colors

- **Rose** (#b5244f): Primary actions, borders, text emphasis
  - `rose-500`: Main brand color
  - `rose-400`, `rose-600`: Hover/active states

- **Pizazz** (#e67f3c): Backgrounds, secondary elements
  - `pizazz-500`: Main background color

- **Lavender** (#f0d7f5): Cards, containers, light backgrounds
  - `lavender-500`: Card backgrounds

### Semantic Colors

- Success: `green-600`
- Warning: `yellow-200`
- Error: `red-600`

## Typography Scale

### Headings

- **H1 (Page Title)**: `text-5xl font-bold` - 48px
- **H2 (Section Title)**: `text-4xl font-semibold` - 36px
- **H3 (Card Title)**: `text-3xl font-bold` - 30px
- **H4 (Label)**: `text-2xl font-medium` - 24px
- **H5 (Small Label)**: `text-xl font-medium` - 20px

### Body Text

- **Large**: `text-xl` - 20px
- **Base**: `text-lg` - 18px
- **Small**: `text-base` - 16px
- **Extra Small**: `text-sm` - 14px

## Spacing Scale

### Padding

- **Small**: `p-2` or `px-3 py-2` - 8px
- **Medium**: `p-4` or `px-5 py-3` - 16px
- **Large**: `p-6` or `px-8 py-4` - 24px

### Margins

- **Tiny**: `m-1 / mx-2 my-1` - 4px
- **Small**: `m-2 / mx-3 my-2` - 8px
- **Medium**: `m-4 / mx-5 my-3` - 16px
- **Large**: `m-6 / mx-8 my-5` - 24px
- **Extra Large**: `m-10` - 40px

## Component Patterns

### Buttons

#### Primary Button

```html
<button class="btn-primary">Text</button>
```

Classes: `px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-rose-500 text-lavender-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400`

#### Secondary Button

```html
<button class="btn-secondary">Text</button>
```

Classes: `px-6 py-3 text-base font-bold uppercase border-2 rounded-lg shadow-sm transition-all duration-150 bg-lavender-500 text-rose-500 border-rose-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400`

### Cards

#### Standard Card

```html
<div class="card">Content</div>
```

Classes: `p-5 border-2 border-rose-500 bg-lavender-500 rounded-xl shadow-sm`

#### Team Card (HomePage)

```html
<div class="card-team">Content</div>
```

Classes: `relative flex flex-col items-center pt-10 pb-4 px-4 border-2 border-rose-500 bg-lavender-500 rounded-xl shadow-md`

### Input Fields

```html
<input class="input-field" />
```

Classes: `px-4 py-2 text-lg border-2 rounded-lg bg-lavender-500 border-rose-500 text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400`

### Icons

- **Small**: `w-6 h-6` - 24px
- **Medium**: `w-8 h-8` - 32px
- **Large**: `w-12 h-12` - 48px
- **Action Button Icons**: `w-10 h-10` - 40px

### Modals

- Border: `border-2 border-rose-500`
- Background: `bg-pizazz-500`
- Text: `text-rose-500` for headings, `text-gray-50` for body
- Rounded: `rounded-xl`
- Max width: `sm:max-w-lg`

### Shadows

- **Small**: `shadow-sm` - Subtle
- **Medium**: `shadow-md` - Cards
- **Large**: `shadow-lg` - Hover states, important elements

## Border Radius

- **Small**: `rounded-lg` - 8px (inputs, small buttons)
- **Large**: `rounded-xl` - 12px (cards, modals, large buttons)
- **Circle**: `rounded-full` - Circular icons

## Responsive Breakpoints

- **xs**: 361px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **xsheight**: min-height 668px
