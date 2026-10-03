# Game Experience & Visual Design Specification

## 1. Purpose

This document defines the visual language, interaction philosophy, player experience, character system, world presentation, UI principles, asset direction, and design constraints for the Lagos persistent multiplayer game.

This is not a generic web application.

The product must feel like a **living 3D world first** and a software application second.

The player should feel that they are entering Lagos, creating a person, building a life, meeting other people, owning things, and participating in an evolving city.

---

# 2. Core Design Philosophy

The experience should combine three design influences:

### A. Apple-style product design

Use Apple-like principles for:

- simplicity
- spacing
- typography
- transitions
- hierarchy
- restraint
- animation
- visual polish
- clarity
- progressive disclosure
- removing unnecessary UI

This does **not** mean copying Apple's visual identity.

Do not use excessive gradients, glassmorphism, floating cards, unnecessary shadows, or decorative UI simply because they look modern.

The principle is:

> Make complex systems feel simple.

---

### B. Modern game design

Use game design principles for:

- character identity
- animation
- environmental storytelling
- spatial interaction
- sound
- feedback
- progression
- discovery
- player agency
- persistent possessions
- social interaction

The player should understand the world primarily by **seeing and interacting with it**, not by reading dashboards.

---

### C. Lagos-specific visual identity

The world must visibly communicate Lagos.

Do not create a generic African city and simply rename locations to Lagos.

Lagos should appear through:

- architecture
- roads
- drainage
- street layouts
- shops
- signs
- compounds
- utility infrastructure
- vehicles
- clothing
- food
- businesses
- sounds
- people
- density
- weather
- street activity
- neighborhoods
- social behavior

The result should feel inspired by real Lagos while remaining stylized and appropriate for a game.

---

# 3. Overall Visual Direction

Target:

**Stylized + believable + polished + warm + dense + human.**

Avoid:

- photorealistic GTA-style graphics
- generic low-poly game assets
- childish cartoon graphics
- Minecraft-like blockiness
- random marketplace asset combinations
- futuristic sci-fi UI
- generic SaaS dashboards
- excessive neon
- excessive glassmorphism
- excessive gradients
- visual clutter

The game should look intentionally designed rather than assembled from unrelated asset packs.

---

# 4. The World Is the Primary Interface

The 3D world is the primary interface.

The player should not constantly interact with:

- dashboards
- menus
- cards
- tables
- modal windows
- navigation sidebars

Instead:

**World → object → interaction → contextual UI**

Example:

Player walks toward a restaurant.

Instead of opening:

`Restaurants → List → Restaurant → Details`

the player sees the restaurant.

They approach the entrance.

A subtle interaction appears:

> Enter

After entering:

> Welcome to Mama T's
> Jollof Rice ₦2,500
> Chicken ₦4,000

The UI should appear because the player is interacting with something.

---

# 5. Account Creation

Account creation should not feel like creating an account for a SaaS application.

Do not start with a large form.

The experience should transition from:

**creating an account**

into:

**creating a person.**

Recommended flow:

```text
Create Account
      ↓
Create Your Person
      ↓
Appearance
      ↓
Clothing
      ↓
Starting Situation
      ↓
Life Card
      ↓
Enter Lagos
```

The technical account and the player's identity are separate concepts.

---

# 6. Character Creation

Character creation should be visually driven.

The character should remain visible throughout the process.

The player should see the character in a 3D environment with subtle idle animation.

Changing an option should immediately update the character.

Avoid:

```text
Select Gender
Select Skin
Select Hair
Select Shirt
Select Shoes
[Apply]
```

Prefer:

```text
              3D CHARACTER

        [ Hair ] [ Face ] [ Clothes ]

             ←  options  →

                    Continue
```

The character should feel like a person rather than a database record.

---

# 7. Character System

Characters should be modular.

Conceptually:

```text
Character
├── Body
├── Skin
├── Face
├── Hair
├── Eyes
├── Eyebrows
├── Facial Hair
├── Top
├── Bottom
├── Shoes
├── Accessories
└── Animation Set
```

The system should support combinations rather than requiring a completely unique 3D model for every player.

Example:

```text
20 body/face bases
×
10 hairstyles
×
20 tops
×
10 bottoms
×
10 shoes
×
20 accessories
```

This creates a large amount of visual variety without requiring thousands of unique models.

---

# 8. Clothing Is Part of the Game

Clothing should not only be cosmetic UI.

Clothing can eventually become an actual possession.

For example:

```text
Player
  ↓
Wardrobe
  ↓
Owned clothing
  ↓
Equipped clothing
```

Clothing may be:

- purchased
- gifted
- traded
- produced by businesses
- associated with organizations/events
- worn for different social contexts

The wardrobe should therefore eventually connect to the game's economy.

---

# 9. Starting Situation

After character creation, the player chooses a starting circumstance.

Examples:

- Student
- Looking for work
- Working
- Freelancer
- Small business owner

These are **starting circumstances**, not permanent classes.

Do not permanently lock the player into one profession.

The player should be able to change their life.

Example:

```text
Student
   ↓
Graduate
   ↓
Job
   ↓
Business
   ↓
Business owner
   ↓
Investor
```

---

# 10. Life Card

Before entering the world, show a concise summary.

Example:

```text
YOUR LIFE

Name
Favour

Starting situation
Looking for work

Starting cash
₦50,000

Home
Shared apartment

Inventory
Phone
Backpack
Basic clothes

Location
Yaba

Ready?

ENTER LAGOS
```

This should feel like the beginning of a story, not a registration confirmation.

---

# 11. In-Game HUD

The HUD should be minimal.

Possible persistent information:

```text
₦42,500        18:42
```

Potentially:

```text
Health / status
```

Only show information that is genuinely useful.

Do not permanently display:

- ten buttons
- minimap
- quest list
- inventory
- notifications
- player stats
- multiple menus

unless they are actually necessary.

---

# 12. Contextual Interaction

Interactions should appear near the object/player.

Examples:

```text
Door

[ E ] Enter
```

```text
Car

[ E ] Enter vehicle
```

```text
Restaurant

[ E ] Enter
```

```text
Player

[ E ] Talk
```

```text
ATM

[ E ] Use ATM
```

Interaction UI should be subtle and disappear when the player moves away.

---

# 13. Camera

Default camera should provide a strong third-person view.

The player should clearly see:

- their character
- nearby players
- buildings
- roads
- vehicles
- environment

Camera movement should feel smooth.

Avoid:

- abrupt camera snapping
- excessive camera shake
- unnecessary cinematic movement
- uncomfortable acceleration
- visual obstruction

The player should always feel spatially grounded.

---

# 14. Animation

Characters should never appear completely static.

At minimum support:

- idle
- walking
- running
- jumping
- interacting
- sitting
- talking
- entering/exiting buildings
- carrying objects

Animations should transition smoothly.

Movement state should drive animation automatically.

Conceptually:

```text
velocity == 0
    ↓
idle

velocity > walk threshold
    ↓
walk

velocity > run threshold
    ↓
run
```

---

# 15. Environment

The environment should be modular.

Do not attempt to create the entire Lagos city as one giant 3D scene.

Start with a small district.

Recommended first environment:

**Yaba**

Create a small playable neighborhood containing:

- residential buildings
- shops
- restaurant
- bank/ATM
- office
- school/university environment
- church
- mosque
- streets
- sidewalks
- drainage
- utility poles
- fences
- parked vehicles
- street vendors
- trees
- signage
- generators
- water tanks
- other recognizable environmental props

The initial world should be small but detailed.

---

# 16. Building System

Buildings should use modular components.

```text
Building
├── Walls
├── Windows
├── Doors
├── Roof
├── Sign
├── Fence
├── Interior
└── Props
```

This allows multiple buildings to be created from the same asset library.

Do not duplicate entire buildings unnecessarily.

---

# 17. Roads and Streets

Roads should be modular.

Create reusable:

- straight roads
- intersections
- corners
- sidewalks
- drainage sections
- road markings
- crossings
- streetlights
- utility poles

This makes it possible to construct larger areas without creating every street manually.

---

# 18. Vehicles

Initial vehicle library should include recognizable Lagos transportation.

Examples:

- normal cars
- danfo
- BRT-style bus
- motorcycle
- delivery vehicle
- taxi

Vehicles should eventually support:

- ownership
- driving
- parking
- businesses
- public transportation

---

# 19. Sound

Sound is part of the visual identity.

The world should not feel silent.

Potential environmental audio:

- traffic
- people talking
- generators
- horns
- markets
- restaurants
- construction
- rain
- footsteps
- vehicles
- music
- church activity
- mosque activity
- nightlife
- street vendors

Audio should be spatial where appropriate.

---

# 20. UI Design Language

Normal UI should use:

- clean typography
- generous spacing
- restrained borders
- subtle shadows
- clear hierarchy
- smooth transitions
- minimal decoration
- strong contrast
- consistent component behavior

The UI should feel premium without trying too hard to look premium.

Avoid:

- giant gradients
- excessive rounded cards
- dashboard-card overload
- random icons everywhere
- excessive badges
- excessive borders
- unnecessary animations
- excessive glass effects

---

# 21. Transitions

Transitions should feel deliberate.

Use motion to explain:

- where something came from
- where something is going
- what changed
- what the player selected

Avoid fast UI popping.

Prefer:

```text
fade
+
small movement
+
soft scale
```

rather than:

```text
instant appearance
```

Transitions should generally feel calm and controlled.

---

# 22. Social UI

Social features should feel connected to the world.

Do not build a giant social-media dashboard.

Examples:

Player approaches another player:

```text
Favour
Online

[ Talk ]
[ Add Friend ]
[ View Profile ]
```

A club could have:

```text
THE YABA TECH CLUB

Tonight
19:00

45 members
```

An event could exist physically in the world.

The player should be able to walk into the event rather than simply clicking an event card.

---

# 23. Player Identity

A player's identity should emerge from:

- appearance
- clothing
- home
- possessions
- business
- friends
- organizations
- reputation
- activities
- neighborhood
- achievements

The player's profile should eventually communicate:

> Who is this person?

not simply:

> What is this user's database ID?

---

# 24. Asset Philosophy

All assets must belong to a coherent visual language.

Do not mix:

```text
Photorealistic building
+
Pixar character
+
Minecraft tree
+
GTA vehicle
+
cartoon UI
```

Even if each individual asset looks good, the combined result will look poor.

Every asset should be evaluated against:

- art style
- scale
- polygon budget
- texture quality
- lighting
- material style
- color language
- Lagos authenticity
- performance requirements

---

# 25. Asset Pipeline

Preferred pipeline:

```text
Asset Source
     ↓
Download
     ↓
License Check
     ↓
Blender
     ↓
Clean / Modify
     ↓
Optimize
     ↓
Export .glb
     ↓
Game Asset Directory
     ↓
Three.js / React Three Fiber
     ↓
World
```

Assets should normally be delivered to the browser as optimized `.glb`/`.gltf`.

---

# 26. Asset Sources

Potential sources include:

- Fab
- Sketchfab
- CGTrader
- Kenney
- Mixamo
- Blender
- custom-made assets
- commissioned assets
- generated assets where appropriate

Every downloaded asset must have its license recorded.

Never assume that an asset is commercially usable merely because it can be downloaded.

---

# 27. Asset Directory

Use a predictable structure.

Example:

```text
assets/
├── characters/
│   ├── bodies/
│   ├── faces/
│   ├── hair/
│   ├── clothing/
│   └── animations/
│
├── buildings/
│   ├── residential/
│   ├── commercial/
│   ├── religious/
│   └── public/
│
├── environment/
│   ├── roads/
│   ├── sidewalks/
│   ├── vegetation/
│   └── utilities/
│
├── vehicles/
│
├── props/
│
├── audio/
│
└── ui/
```

Use descriptive filenames.

Bad:

```text
asset_final2.glb
newbuilding.glb
thing1.glb
```

Good:

```text
yaba_shop_small_01.glb
lagos_danfo_01.glb
concrete_utility_pole_01.glb
three_story_residential_01.glb
```

---

# 28. Performance Requirements

Browser performance is a first-class requirement.

Do not import huge game-engine assets blindly.

Agents must consider:

- polygon count
- texture resolution
- draw calls
- file size
- compression
- loading time
- memory usage
- mobile/browser performance

Use:

- GLB
- Draco where appropriate
- KTX2/Basis textures where appropriate
- instancing
- LOD
- asset reuse
- lazy loading
- spatial loading

Do not optimize prematurely, but do not knowingly introduce massive assets into the world.

---

# 29. Coding Agent Rules

Coding agents must not:

1. Replace the intended game experience with a generic dashboard.
2. Invent a random visual style.
3. Download random assets without documenting their source.
4. Assume assets are commercially licensed.
5. create placeholder UI and declare the design finished.
6. use placeholder cubes as permanent game assets.
7. mix incompatible asset styles.
8. create huge UI systems when a world interaction would be better.
9. add unnecessary gradients, glassmorphism, or card layouts.
10. implement features that contradict this document without discussing the conflict.

---

# 30. Agent Asset Workflow

When an agent needs an asset:

```text
1. Identify the required asset.
2. Search approved asset sources.
3. Present candidate assets and source.
4. Record license information.
5. Get approval when visual/licensing judgment is required.
6. Download the asset.
7. Inspect the asset.
8. Optimize it.
9. Convert/export to GLB if necessary.
10. Place it in the correct asset directory.
11. Register/load it in the game.
12. Test it in the actual environment.
```

Agents should prefer **reusable modular assets** over one-off assets.

---

# 31. Placeholder Policy

Placeholders are allowed during engineering.

For example:

```text
cube → temporary building
capsule → temporary player
plane → temporary road
```

However, placeholders must be clearly marked as temporary.

Do not design the final UX around placeholder geometry.

The architecture must allow the real assets to replace placeholders without rewriting the game.

---

# 32. Design Priority

When making design decisions, prioritize:

```text
1. Player experience
2. Lagos authenticity
3. Clarity
4. Performance
5. Consistency
6. Visual polish
7. Technical convenience
```

Do not sacrifice the entire experience simply because a technically easier implementation exists.

At the same time, do not introduce unnecessary technical complexity before it is required.

---

# 33. North Star

The player should be able to look at the screen and think:

> "This is my person. This is my neighborhood. These are real people. This is my stuff. I can go anywhere and do something."

The game should feel like a **place**, not an application.
