# Entity Selection Flow Mockups
**Date**: January 11, 2025  
**Purpose**: Visual flow showing entity selection and intelligence response

---

## Selection Flow Sequence

### 1. Initial State - Overview Mode
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Select Entity ▼ │ 📖 📤 💰 🏭 ❓ │ 🔍 Search... │ ⊞ ⊟ ⟲ │ ⚙️      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          Journey Overview                               │
│                                                                         │
│      (A)          (S)          (M)          (V)          (D)          │
│     Alex        Sarah       Marcus      Victoria      Derek           │
│       │           │           │           │           │               │
│       └───────────┴───────────┴───────────┴───────────┘               │
│                         20 Characters Total                            │
│                                                                         │
│                    Click any character to explore                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                            All nodes small, equal opacity
```

### 2. User Clicks Sarah - Transition Begins
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Character: Sarah ▼ │ 📖 📤 💰 🏭 ❓ │ 🔍 Search... │ ⊞ ⊟ ⟲ │ ⚙️    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                     Transitioning... (300ms)                           │
│                                                                         │
│      (·)         ╔═══╗         (·)          (·)          (·)          │
│     Alex        ║ S ║       Marcus      Victoria      Derek           │
│       ·          ╚═══╝         ·           ·           ·              │
│       └───────────╱ ╲──────────┴───────────┴───────────┘              │
│                  ↙   ↘                                                 │
│               Growing  Revealing                                       │
│                      connections                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                         Sarah scaling up, others fading
```

### 3. Entity Focus Mode - Sarah Selected
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Character: Sarah ▼ │ 📖 📤 💰 🏭 ❓ │ 🔍 Search... │ ⊞ ⊟ ⟲ │ ⚙️    │
├───────────────────────────────────────────────────────┬─────────────────┤
│                                                       │ Sarah Mitchell  │
│              Sarah's Journey & Impact                 │ Tier 2 Character│
│                                                       ├─────────────────┤
│    ◆ Voice Memo ·····················┐               │ Story: High     │
│    $1000                             ↓               │ • 3 events      │
│      ↑                          ┌─────────┐          │ • Missing Act 2 │
│  ╔═══════╗ ══════════════════> │ Jewelry │ ══> ▶T1  │                 │
│  ║ SARAH ║                     │   Box   │          │ Social: 8 collab│
│  ╚═══════╝ <···················└─────────┘          │ ⚠️ Overloaded    │
│      ║ ↓                             ↑               │                 │
│     (D) (A)                         (M)              │ Economic: $12.5k│
│    Derek Alex                     Marcus             │ Good balance    │
│                                                       │                 │
│  ══ Strong dependency  ··· Weak connection           │ [View Details] │
└───────────────────────────────────────────────────────┴─────────────────┤
```

### 4. User Toggles Story Intelligence
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Character: Sarah ▼ │ ● 📤 💰 🏭 ❓ │ 🔍 Search... │ ⊞ ⊟ ⟲ │ ⚙️    │
├───────────────────────────────────────────────────────┬─────────────────┤
│                                                       │ Sarah Mitchell  │
│         Sarah's Journey + Story Intelligence          │ Tier 2 Character│
│                                                       ├─────────────────┤
│    ◆ Voice Memo ┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┐               │ Story: HIGH ●   │
│    $1000 [Critical]                  ┊               │ Timeline Events:│
│      ┊                          ┌─────────┐          │ • Sarah finds   │
│  ╔═══════╗ ━━━━━━━━━━━━━━━━━> │ Jewelry │ ━━> ▶T1  │   voice memo    │
│  ║ SARAH ║ [Story Arc 65%]     │   Box   │   [Act1] │ • Confronts     │
│  ╚═══════╝ <┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅└─────────┘          │   Victoria      │
│      ┊ ┊                             ┊               │ • Missing:      │
│     (D) (A)                         (M)              │   Resolution    │
│    Derek Alex                     Marcus             │                 │
│  [Support] [Witness]            [Suspect]            │ [Suggest Event] │
│                                                       │                 │
│  ━━ Story critical  ┅┅ Story connection              │                 │
└───────────────────────────────────────────────────────┴─────────────────┤
```

### 5. Multi-Layer Intelligence (Story + Social)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡] Character: Sarah ▼ │ ● ● 💰 🏭 ❓ │ 🔍 Search... │ ⊞ ⊟ ⟲ │ ⚙️      │
├───────────────────────────────────────────────────────┬─────────────────┤
│                                                       │ Sarah Mitchell  │
│      Sarah's Journey + Story + Social Intel          │ Tier 2 Character│
│                                                       ├─────────────────┤
│    ◆ Voice Memo ┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┐               │ Combined Intel: │
│    $1000 [Critical] (3)              ║               │                 │
│      ┊                          ┌─────────┐          │ Story Arc: 65%  │
│  ╔═══════╗ ━━━━━━━━━━━━━━━━━> │ Jewelry │ ━━> ▶T1  │ • Need closure  │
│  ║ SARAH ║ ═══════════════════ │Box (2)  │          │                 │
│  ╚═══════╝ <┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅└─────────┘          │ Social Load: 8  │
│      ║ ║ ║                           ║               │ ⚠️ 60% above avg │
│     (D) (A)                         (M)              │ • Derek: 3      │
│    Derek Alex                     Marcus             │ • Alex: 2       │
│     (3)  (2)                       (3)               │ • Marcus: 3     │
│                                                       │                 │
│  ━ Story ═ Social (n) = Collaboration count          │ [Rebalance]     │
└───────────────────────────────────────────────────────┴─────────────────┤
```

---

## Interaction States

### Node Hover States
```
Default State          Hover State           Selected State        
     (S)                  (S)                  ╔═══╗
    Sarah               Sarah                 ║ S ║  
                       [+info]                ╚═══╝
                                              Sarah
40px circle         Tooltip appears         56px + glow
```

### Edge Interaction
```
Default Edge          Hover Edge            Intelligence Active
  A ──── B             A ━━━━ B              A ┅┅┅┅ B
                     [Dependency]           Story thread
```

### Progressive Disclosure on Zoom
```
Zoom Out (0.5x)                    Zoom In (1.5x)
   ● ● ●                          ╔═════════════╗
   ● ● ●                          ║ Sarah M.    ║
   ● ● ●                          ║ Tier 2      ║
                                  ║ 8 collabs   ║
Icon grid                         ║ $12.5k val  ║
                                  ╚═════════════╝
                                  Full details
```

---

## Error & Loading States

### Loading Intelligence
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Calculating Intelligence...                      │
│                                                                         │
│                              ╔═══════╗                                  │
│                              ║ SARAH ║                                  │
│                              ╚═══════╝                                  │
│                                 ···                                     │
│                           ◆ ··· ◆ ··· ◆                                │
│                                 ···                                     │
│                         [████████░░░░] 75%                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Performance Warning
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Approaching node limit (47/50 nodes visible)                          │
│                                                                         │
│ Some nodes aggregated for performance:                                 │
│                                                                         │
│    ┌···········┐     ┌···········┐     ┌···········┐                  │
│    : ◆ ◆ ◆ [12]:     : ◆ ◆ ◆ [8] :     : ◆ ◆ ◆ [7] :                  │
│    :◆ ◆ ◆ ◆ ◆ :     :◆ ◆ ◆ ◆ ◆ :     :◆ ◆ ◆ ◆ ◆ :                  │
│    └···········┘     └···········┘     └···········┘                  │
│   Memory Tokens        Props          Set Dressing                     │
│                                                                         │
│                    [View All] [Dismiss]                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Interaction Flow

### 1. Mobile Overview
```
┌─────────────────┐
│ ≡ ALNTool    ⋮ │
├─────────────────┤
│ Select Character│
│ ┌─────┬─────┐   │
│ │ (A) │ (S) │   │
│ │Alex │Sarah│   │
│ ├─────┼─────┤   │
│ │ (M) │ (V) │   │
│ │Marc │Vict │   │
│ └─────┴─────┘   │
│                 │
│ View: Overview  │
└─────────────────┘
```

### 2. Mobile Entity Selected
```
┌─────────────────┐
│ ≡ Sarah      ⋮ │
├─────────────────┤
│ ┌───┬────────┐ │
│ │Map│ Intel  │ │
│ └───┴────────┘ │
│                 │
│   ╔═══════╗    │
│   ║ SARAH ║    │
│   ╚═══════╝    │
│      ║ ║        │
│     ◆   ◆       │
│                 │
│ [Tap for Intel] │
└─────────────────┘
```

### 3. Mobile Intelligence Panel
```
┌─────────────────┐
│ ≡ Sarah      × │
├─────────────────┤
│ Intelligence    │
├─────────────────┤
│ Story: High     │
│ • 3 events      │
│ • Missing Act 2 │
│                 │
│ Social: 8 collab│
│ ⚠️ Overloaded    │
│ • Derek: 3      │
│ • Alex: 2       │
│                 │
│ [View Graph]    │
└─────────────────┘
```

---

*These mockups demonstrate the complete interaction flow from overview to detailed intelligence analysis.*