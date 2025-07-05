# User Journey Analysis: From 18 Pages to Entity-Level Design Intelligence

**Date**: January 9, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Purpose**: Document complete workflows for all 4 user types to inform view system architecture decisions

---

## Executive Summary

Our user research reveals that designers spend 70% of their time context-switching between pages, mentally calculating impact, and discovering broken dependencies only during playtests. This document captures their actual workflows, pain points, and the intelligence they need to make confident design decisions.

---

## 🎭 Sarah - The Experience Designer

### Persona Profile
- **Role**: Lead Narrative Designer
- **Experience**: 8 years in immersive theater and escape rooms
- **Primary Goal**: Create emotionally resonant character journeys that players remember
- **Success Metric**: Players report feeling connected to characters and understanding their motivations
- **Key Challenge**: Balancing narrative depth with gameplay accessibility

### Current Task: Develop Victoria's Character Journey

#### Starting Context
Sarah receives feedback from playtest: "Victoria feels underdeveloped. Players don't understand why she was murdered or care about solving it."

#### Current Workflow (18-Page Nightmare)

**Step 1: Review Victoria's Current State**
- Opens **CharactersPage** → Searches for Victoria → Sees basic info (name, tier, logline)
- *Pain Point*: Can't see Victoria's actual story content or timeline events
- Opens **TimelineEventsPage** → Manually searches for "Victoria" → Finds 3 events
- *Pain Point*: Can't see which elements reveal these events

**Step 2: Identify Content Gaps**
- Opens **ElementsPage** → Filters by owner → Only 2 elements owned by Victoria
- *Pain Point*: Can't see if Victoria's story is revealed through other characters' elements
- Manually searches all elements for "Victoria" in description → Finds 5 more
- *Pain Point*: No way to see complete story arc from these scattered pieces

**Step 3: Design New Content**
- Brainstorms new timeline event: "Victoria's secret meeting with investor"
- Opens **TimelineEventsPage** → Creates new event (in her head, can't actually create)
- *Pain Point*: Can't see where this event fits in overall narrative flow

**Step 4: Determine How Players Discover This**
- Needs to create element: "Victoria's encrypted email"
- Opens **ElementsPage** → Mentally notes this should be Memory Token Audio
- *Pain Point*: Can't determine appropriate value without seeing economy impact

**Step 5: Assign to Puzzle**
- Opens **PuzzlesPage** → Looks for puzzle that could reward this element
- *Pain Point*: Can't see which puzzles Victoria's character can access
- Guesses that "Derek's Laptop Password" puzzle could work

**Step 6: Check Social Dependencies**
- Opens **CharactersPage** → Checks Derek's connections
- Opens **RelationshipMapperPage** → Tries to understand if Derek-Victoria connection makes sense
- *Pain Point*: Can't see how this affects other character interactions

**Step 7: Validate Economic Impact**
- Opens **MemoryEconomyPage** → Tries to calculate if Victoria's tokens are balanced
- *Pain Point*: Can't see how new high-value token affects path choices
- Guesses at 3000 token value

**Step 8: Document for Team**
- Opens external document → Writes notes about all changes
- *Pain Point*: No integrated way to track design decisions
- Emails team with 15 different links to pages

**Total Time**: 45 minutes  
**Pages Visited**: 8+ pages, multiple times  
**Confidence Level**: Low - "Hope this works in playtest"

#### Ideal Workflow (Entity-Level Intelligence)

**Step 1: Select Victoria → See Complete Impact Analysis**
- Journey Intelligence shows:
  - Current story: Only 3 timeline events (murder scene, introduction, one flashback)
  - Content gaps: No relationship development, no motive establishment
  - Element coverage: 7 elements reference Victoria but only 2 she owns
  - Social connections: Low interaction with other characters
  - Economic impact: Underrepresented in token economy (only 2000 total value)

**Step 2: Create New Timeline Event with Live Preview**
- Adds "Victoria's secret meeting with investor"
- Intelligence shows:
  - Story impact: Fills motive gap, explains financial pressure
  - Suggested elements: System recommends encrypted email, meeting notes
  - Character connections: Could strengthen Marcus-Victoria relationship
  - Integration opportunities: Derek's laptop puzzle has capacity

**Step 3: Design Revealing Element with Impact Analysis**
- Creates "Victoria's encrypted email" (Memory Token Audio)
- Intelligence shows:
  - Proposed value: 3000 tokens
  - Economic impact: Increases Detective path pressure by 15%
  - Accessibility: Currently only Derek can access via laptop puzzle
  - Alternative options: Could add to Sarah's jewelry box for different dynamic

**Step 4: Validate Complete Journey**
- Reviews Victoria's enhanced journey:
  - Story arc: Now complete with motive, relationships, secrets
  - Discovery paths: Multiple characters can uncover her story
  - Economic balance: Token distribution supports all three paths
  - Production requirements: 2 new props needed, both simple

**Total Time**: 10 minutes  
**Pages Visited**: 1 (Journey Intelligence View)  
**Confidence Level**: High - "I can see exactly how this enhances the game"

### Critical Decision Points

1. **Story Integration Decision**
   - Need: "Where does this timeline event have maximum narrative impact?"
   - Intelligence Required: Character relationship map, existing story gaps, discovery potential

2. **Element Value Decision**
   - Need: "What token value creates tension without breaking balance?"
   - Intelligence Required: Path pressure analysis, economic distribution, choice psychology

3. **Social Choreography Decision**
   - Need: "Which character interactions does this create or enhance?"
   - Intelligence Required: Current social load, collaboration opportunities, dramatic potential

4. **Production Reality Check**
   - Need: "Can we actually produce this element?"
   - Intelligence Required: Prop requirements, RFID needs, dependency chains

---

## 🧩 Marcus - The Puzzle Designer

### Persona Profile
- **Role**: Senior Game Designer specializing in puzzle mechanics
- **Experience**: 12 years designing escape rooms and puzzle games
- **Primary Goal**: Create puzzles that drive meaningful social interactions
- **Success Metric**: Players collaborate naturally and feel clever solving puzzles
- **Key Challenge**: Balancing puzzle difficulty with story revelation timing

### Current Task: Design "The Safe Combination" Puzzle

#### Starting Context
Marcus needs to create a puzzle that forces collaboration between Alex and Derek while revealing critical murder evidence.

#### Current Workflow (18-Page Chaos)

**Step 1: Understand Character Capabilities**
- Opens **CharactersPage** → Looks at Alex → No info about puzzle capabilities
- Opens **ElementsPage** → Filters by Alex as owner → Sees business cards
- Opens **CharactersPage** → Looks at Derek → No owned elements info
- Opens **ElementsPage** → Filters by Derek → Sees gym membership, receipts

**Step 2: Design Puzzle Mechanics**
- Mental note: "Safe needs 4-digit code from business card + gym membership"
- Opens **PuzzlesPage** → Can't actually create, just browses similar puzzles
- *Pain Point*: Can't see dependencies of existing puzzles for patterns

**Step 3: Determine Rewards**
- Opens **ElementsPage** → Searches for high-value evidence
- Finds "Threatening letter to Victoria" worth 4000 tokens
- *Pain Point*: Can't see if this is already assigned to another puzzle

**Step 4: Check Social Balance**
- Opens **RelationshipMapperPage** → Tries to see Alex-Derek connection
- *Pain Point*: No data about how many puzzles already require Alex-Derek collaboration
- Manually counts by opening multiple puzzle detail pages

**Step 5: Validate Narrative Flow**
- Opens **TimelineEventsPage** → Searches for events this evidence should reveal
- *Pain Point*: Can't see if players have enough context when they find this
- Worries about players finding evidence before understanding its significance

**Step 6: Economic Impact Check**
- Opens **MemoryEconomyPage** → 4000 token reward seems high
- *Pain Point*: Can't model how this affects path choices
- No way to see cumulative effect with other puzzle rewards

**Step 7: Production Requirements**
- Mental list: Need physical safe, custom business cards, gym membership prop
- Opens **ElementsPage** → Checks if these props exist
- *Pain Point*: No unified view of prop dependencies

**Total Time**: 60 minutes  
**Pages Visited**: 7 pages, 20+ times  
**Confidence Level**: Very Low - "This might completely break game balance"

#### Ideal Workflow (Puzzle Workspace Intelligence)

**Step 1: Open Puzzle Workspace → See Dependency Web**
- Creates "The Safe Combination" puzzle
- Intelligence shows:
  - Available elements from Alex: Business cards, cease & desist letter
  - Available elements from Derek: Gym membership, receipts
  - Current collaboration load: Alex has 8 interactions, Derek has 5
  - Recommendation: Balance load by using Derek's items more

**Step 2: Design Mechanics with Social Preview**
- Sets requirements: Derek's gym ID number + Alex's business card sequence
- Intelligence shows:
  - Social dynamic: Creates forced Alex-Derek interaction
  - Timing: Both elements available in Act 1, good for early collaboration
  - Alternative: Could use Sarah's jewelry box key for 3-way interaction

**Step 3: Assign Rewards with Impact Analysis**
- Selects "Threatening letter to Victoria" as reward
- Intelligence shows:
  - Token value: 4000 (high pressure on Black Market path)
  - Story impact: Reveals major motive, needs setup via earlier evidence
  - Economic ripple: Combined with other Derek puzzles, creates 8000 token decision
  - Warning: Players might miss context if they haven't found Victoria's timeline events

**Step 4: Balance and Refine**
- Adjusts token value to 3000 based on economic analysis
- Adds hint system: Letter references Victoria's email (found elsewhere)
- Intelligence confirms:
  - Social: Balanced collaboration requirements
  - Economic: Appropriate path pressure
  - Narrative: Proper story revelation sequence
  - Production: All props identified and tracked

**Total Time**: 15 minutes  
**Interface**: Puzzle Workspace View  
**Confidence Level**: High - "I can see all dependencies and impacts"

### Critical Decision Points

1. **Collaboration Design Decision**
   - Need: "Which characters should this puzzle force to interact?"
   - Intelligence Required: Social load balance, character relationships, interaction quality

2. **Reward Assignment Decision**
   - Need: "What story/evidence should this puzzle reveal?"
   - Intelligence Required: Narrative flow, revelation timing, player knowledge state

3. **Difficulty Calibration Decision**
   - Need: "How hard should this puzzle be given its importance?"
   - Intelligence Required: Critical path analysis, player skill assumptions, hint availability

4. **Economic Impact Decision**
   - Need: "How does this reward affect the three-path choice?"
   - Intelligence Required: Cumulative token values, path pressure, decision psychology

---

## 📦 Alex - The Production Coordinator

### Persona Profile
- **Role**: Production Manager for immersive experiences
- **Experience**: 15 years in theater production and live events
- **Primary Goal**: Ensure every design element is producible and reliable
- **Success Metric**: Zero game-breaking prop failures during runtime
- **Key Challenge**: Tracking cascading dependencies across 40 player journeys

### Current Task: Production Audit for Next Playtest

#### Starting Context
Three weeks until playtest. Alex needs to identify all missing props and potential failure points.

#### Current Workflow (18-Page Archaeological Dig)

**Step 1: Audit Character Starting Items**
- Opens **CharactersPage** → Lists all 20 characters
- For EACH character: Opens detail page → Manually notes coat check items
- *Pain Point*: No unified view of all starting requirements
- Creates spreadsheet: "Character Starting Items.xlsx"

**Step 2: Track Puzzle Requirements**
- Opens **PuzzlesPage** → 35 puzzles to check
- For EACH puzzle: Opens detail → Notes required elements
- *Pain Point*: Can't see which elements need physical props vs digital
- Updates spreadsheet: "Puzzle Dependencies.xlsx"

**Step 3: Identify Element Props**
- Opens **ElementsPage** → 100+ elements to review
- Filters by "In Development" status → 23 elements
- *Pain Point*: Status doesn't indicate what production work remains
- New spreadsheet: "Props Needed.xlsx"

**Step 4: RFID Token Tracking**
- Opens **ElementsPage** → Filters for Memory Tokens
- Manually counts tokens needing RFID → 45 tokens
- *Pain Point*: Can't see which are assigned to characters already
- Another spreadsheet: "RFID Status.xlsx"

**Step 5: Dependency Chain Analysis**
- Tries to trace: "If Derek's gym bag is missing, what breaks?"
- Opens **PuzzlesPage** → Searches for puzzles needing gym bag
- Opens **CharactersPage** → Sees which characters need those puzzle rewards
- *Pain Point*: Manual tracing takes 10 minutes per prop
- Gives up after 5 critical props

**Step 6: Social Prop Requirements**
- Realizes collaborative puzzles need shared props
- Opens **RelationshipMapperPage** → No prop information
- Opens each collaborative puzzle individually
- *Pain Point*: No view of props that multiple characters need

**Step 7: Production Timeline**
- Opens external project management tool
- Manually enters all props from spreadsheets
- *Pain Point*: No integration with design changes
- Design changes won't update production timeline

**Total Time**: 4 hours  
**Pages Visited**: 100+ page loads  
**Confidence Level**: Low - "I'm sure I missed something critical"

#### Ideal Workflow (Production Reality Intelligence)

**Step 1: Open Production Checklist View**
- Intelligence immediately shows:
  - Missing props: 12 critical, 8 nice-to-have
  - RFID status: 38/45 tokens created
  - Dependency risks: 3 props that break multiple journeys
  - Social requirements: 5 props needed for collaborative puzzles

**Step 2: Critical Path Analysis**
- Filters by "Game-Breaking if Missing"
- Intelligence highlights:
  - Derek's gym bag → Breaks 3 character journeys
  - Sarah's jewelry box key → Blocks major story reveal
  - Business card props → Essential for safe combination puzzle

**Step 3: Character Kit Verification**
- Views "Coat Check Requirements" mode
- For each character shows:
  - Starting items (locked compartment + loose items)
  - Items they need from others
  - Items others need from them
  - Missing/incomplete items highlighted

**Step 4: RFID Production Status**
- Views "Memory Token Production"
- Intelligence shows:
  - Created: 38 tokens with content loaded
  - Pending: 7 tokens need content programming
  - Physical props: 12 tokens need physical prop creation
  - Assignment map: Which characters carry which tokens

**Step 5: Dependency Impact Preview**
- Selects "Derek's gym bag" 
- Intelligence shows complete impact:
  - Required by: Safe combination puzzle, locker puzzle
  - Affects: Alex, Sarah, and Marcus's journeys
  - Alternatives: Could redesign puzzle to use receipt instead
  - Production note: Needs custom printing for membership number

**Total Time**: 30 minutes  
**Interface**: Production Checklist View  
**Confidence Level**: High - "I have complete visibility of all requirements"

### Critical Decision Points

1. **Prop Prioritization Decision**
   - Need: "Which missing props are truly game-breaking?"
   - Intelligence Required: Complete dependency chains, affected player journeys, alternatives

2. **Substitution Decision**
   - Need: "Can we use existing props instead of creating new ones?"
   - Intelligence Required: Puzzle flexibility, narrative impact, current inventory

3. **Risk Mitigation Decision**
   - Need: "How do we handle if key player doesn't show up?"
   - Intelligence Required: Character load analysis, prop redistribution options

4. **Production Timeline Decision**
   - Need: "What's the minimum viable prop set for playtest?"
   - Intelligence Required: Critical path analysis, playtest goals, budget constraints

---

## 🎨 Jamie - The Content Creator

### Persona Profile
- **Role**: Narrative Designer and Content Developer
- **Experience**: 5 years in interactive fiction and ARGs
- **Primary Goal**: Develop rich content for underwritten characters
- **Success Metric**: Every character feels essential to the story
- **Key Challenge**: Integrating new content without disrupting existing systems

### Current Task: Develop Content for Howie (Currently Empty Character)

#### Starting Context
Howie exists in the database but has zero timeline events, owns no elements, and players report "Why is this character even here?"

#### Current Workflow (18-Page Content Archaeology)

**Step 1: Assess Current State**
- Opens **CharactersPage** → Finds Howie → Tier: "Supporting" (lowest)
- Opens **TimelineEventsPage** → Searches "Howie" → 0 results
- Opens **ElementsPage** → Filters by Howie as owner → 0 results
- Opens **PuzzlesPage** → Searches for Howie references → 0 results
- *Pain Point*: No view of "content coverage" across characters

**Step 2: Research Integration Opportunities**
- Opens **CharactersPage** → Looks at other Supporting tier characters
- Opens **RelationshipMapperPage** → Howie has no connections
- *Pain Point*: Can't see which characters have "room" for new relationships
- Manually reads through all character descriptions looking for gaps

**Step 3: Brainstorm Character Purpose**
- Decides: Howie could be the caterer who saw suspicious activity
- Opens **TimelineEventsPage** → Checks kitchen/catering events → None exist
- *Pain Point*: Can't see thematic gaps in current timeline

**Step 4: Design Timeline Events**
- Mental list: "Howie serves poisoned champagne", "Howie sees argument", "Howie's past connection to victim"
- Opens **TimelineEventsPage** → Can't create, just notes ideas
- *Pain Point*: Can't see how these events fit chronologically

**Step 5: Create Supporting Elements**
- Ideas: "Catering schedule", "Howie's note about champagne", "Kitchen security footage"
- Opens **ElementsPage** → Tries to gauge appropriate token values
- *Pain Point*: No sense of how these affect economy

**Step 6: Integration Planning**
- Opens **PuzzlesPage** → Which puzzles could reveal Howie's content?
- Thinks: "Kitchen key puzzle" could work but doesn't exist
- *Pain Point*: Can't propose new puzzles that fit existing structure

**Step 7: Social Integration**
- Opens **CharactersPage** → Who should interact with Howie?
- Guesses: Sarah (host) and Derek (security) make sense
- *Pain Point*: Can't see if Sarah and Derek are already overloaded

**Total Time**: 2 hours  
**Pages Visited**: 50+ loads across all pages  
**Confidence Level**: Very Low - "This feels disconnected from everything else"

#### Ideal Workflow (Content Creation Intelligence)

**Step 1: Select Howie → See Integration Opportunities**
- Content Gap Analysis shows:
  - Story coverage: No kitchen/catering perspective on murder
  - Relationship gaps: No service staff viewpoint
  - Economic gaps: Low-tier tokens underrepresented
  - Social gaps: Several characters need more interaction options

**Step 2: Develop Character Concept with Live Integration**
- Defines: "Howie - Observant caterer with past connection to Victoria"
- Intelligence suggests:
  - Timeline integration: Kitchen activity during key murder window
  - Character connections: Natural interaction with Sarah (employer), Derek (security)
  - Element opportunities: Service areas unexplored for evidence
  - Economic niche: Low-value tokens for "Keep" path accessibility

**Step 3: Create Timeline Events with Impact Preview**
- Adds: "Howie notices champagne bottles switched"
- Intelligence shows:
  - Story impact: Provides crucial murder method clue
  - Discovery potential: Kitchen staff area accessible to multiple characters
  - Integration: Links to existing "Victoria's champagne glass" element
  - Character load: Adds content without overloading busy characters

**Step 4: Design Elements with System Integration**
- Creates: "Howie's catering notebook" (Memory Token Physical)
- Intelligence advises:
  - Value: 1500 tokens (accessible for Keep path)
  - Puzzle placement: Could enhance existing "Staff locker" puzzle
  - Character access: Available to service-oriented characters
  - Production: Simple notebook prop with printed pages

**Step 5: Social Choreography Integration**
- Plans Howie-Sarah interaction via "Kitchen inventory checklist"
- Intelligence shows:
  - Social balance: Sarah has capacity for one more interaction
  - Dramatic potential: Employer-employee tension about murder night
  - Puzzle enhancement: Adds social layer to existing kitchen puzzle
  - No overload: Keeps interaction counts balanced

**Total Time**: 30 minutes  
**Interface**: Journey Intelligence with Creation Mode  
**Confidence Level**: High - "Howie now serves a clear purpose in the game"

### Critical Decision Points

1. **Character Purpose Decision**
   - Need: "What unique perspective does this character provide?"
   - Intelligence Required: Story gaps, thematic coverage, viewpoint diversity

2. **Content Value Decision**
   - Need: "How important should this character's information be?"
   - Intelligence Required: Token economy balance, path accessibility, story criticality

3. **Integration Strategy Decision**
   - Need: "How do I add content without disrupting existing systems?"
   - Intelligence Required: Current load analysis, integration points, enhancement opportunities

4. **Social Weaving Decision**
   - Need: "Which relationships does this character naturally create?"
   - Intelligence Required: Social capacity, dramatic potential, character compatibility

---

## Universal Pain Points Across All Users

### 1. Impact Invisibility
Every user struggles to see ripple effects of their decisions. They make changes hoping nothing breaks, discovering problems only in playtest.

### 2. Mental Calculation Overload
Users spend more time calculating impacts in their heads than actually designing. They maintain external spreadsheets to track what the tool should show them.

### 3. Context Loss
Moving between pages loses all context. Users repeatedly search for the same entities, re-filter views, and lose their train of thought.

### 4. Integration Blindness
No user can see how their work integrates with others. They design in isolation, hoping their pieces fit together during assembly.

### 5. Confidence Deficit
Every user ends their session with low confidence, unable to verify their decisions will work. They rely on playtests to reveal problems that should be caught during design.

---

## Key Insights for View System Architecture

### 1. Selection Context is Everything
When users select an entity, they need complete impact analysis immediately. The selection IS the query for intelligence.

### 2. Modal Workflows vs Unified Interface
- Sarah thinks in story arcs
- Marcus thinks in puzzle dependencies  
- Alex thinks in production requirements
- Jamie thinks in integration opportunities

Different modes of the same data, not different interfaces.

### 3. Creation and Analysis are Intertwined
Users don't "analyze then create" - they need live impact preview during the creation process. Creation tools must be embedded in analysis views.

### 4. Progressive Disclosure Critical
- Overview first (what's the impact?)
- Details on demand (why does this happen?)
- Alternatives on request (what if I change this?)

### 5. Shared Team Intelligence
All roles need visibility into others' concerns:
- Sarah needs to see production feasibility
- Marcus needs to see narrative flow
- Alex needs to see design intentions
- Jamie needs to see system constraints

---

## Recommendation: Hybrid Dynamic Views

Based on these journeys, the optimal solution is **Hybrid Dynamic Views** that:

1. **Maintain stable context** while switching intelligence layers
2. **Respond to selection** with appropriate analysis
3. **Embed creation tools** within analysis views
4. **Show cross-functional impact** for all decisions
5. **Preserve workflow state** during exploration

The interface should feel like a "smart assistant" that understands what each user is trying to accomplish and provides the right intelligence at the right moment.

---

*"The tool should think like a senior designer who knows everything about the game and can instantly tell you the implications of any change."*  
— Sarah Chen