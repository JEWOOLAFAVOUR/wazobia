# Wazobia

## 1. Core Idea

A persistent multiplayer economy and city-building game inspired by Lagos.

Players enter a living city with little money and no influence.

They can:

- Get jobs
- Start businesses
- Buy and rent property
- Build buildings
- Trade goods
- Invest
- Borrow and lend money
- Hire other players
- Create companies
- Develop neighborhoods
- Own infrastructure
- Form communities
- Compete or cooperate
- Become wealthy
- Lose everything
- Rebuild

The city continues to exist when a player logs out.

The long-term goal is not simply to accumulate money.

The goal is to **build a life, build wealth, and leave something behind in the city.**

---

# 2. The Design Philosophy

The game should feel like:

> **"What would happen if Lagos itself became a multiplayer economic sandbox?"**

Not:

> "The Sims with Nigerian characters."

And not:

> "SimCity where one player controls the whole city."

Instead:

> **Thousands of people independently making economic decisions that collectively shape the city.**

A player might begin as a delivery rider and eventually own a logistics company.

Another might become a property developer.

Another might become a restaurant owner.

Another might spend months building the biggest technology company in the city.

Another might never become rich but become extremely influential in their neighborhood.

There should be no single correct way to play.

---

# 3. The Three Layers

The game consists of three interconnected layers.

## Layer 1 — Life

The player's personal life.

- Food
- Energy
- Health
- Stress
- Housing
- Transportation
- Friends
- Relationships
- Jobs
- Skills
- Personal possessions

## Layer 2 — Economy

The player's economic life.

- Income
- Expenses
- Savings
- Banking
- Loans
- Investments
- Businesses
- Employees
- Property
- Supply chains
- Markets

## Layer 3 — City

The shared world.

- Land
- Buildings
- Roads
- Businesses
- Neighborhoods
- Infrastructure
- Population
- Transport
- Events
- Local economies

The interesting gameplay happens when the three layers collide.

Example:

A player gets a better job.

↓

They can afford better housing.

↓

They move to another neighborhood.

↓

Their commute changes.

↓

They discover a business opportunity.

↓

They open a restaurant.

↓

They hire three players.

↓

Those players now have income.

↓

The restaurant needs food suppliers.

↓

Other businesses benefit.

↓

The neighborhood becomes more valuable.

A single player's decision can become part of the city's economy.

---

# 4. The Core Game Loop

```text
WAKE UP
   ↓
CHECK CITY / PERSONAL EVENTS
   ↓
DECIDE WHAT TO DO
   ↓
WORK / TRADE / BUILD / SOCIALIZE
   ↓
EARN OR SPEND MONEY
   ↓
MAKE A DECISION
   ↓
EXPERIENCE CONSEQUENCE
   ↓
CITY CONTINUES
   ↓
RETURN LATER
```

The important part is:

> **Every meaningful action should change something.**

---

# 5. Starting the Game

The player starts with:

```text
Money: ₦50,000
Home: Shared apartment
Job: None
Skills: Basic
Reputation: Unknown
Property: None
Business: None
```

They choose an initial path.

### Example paths

- Get a job
- Start hustling
- Trade
- Learn a skill
- Explore the city
- Find roommates
- Start a tiny business

The game does not force one progression path.

---

# 6. The Economy

The economy is the heart of the game.

Money should constantly move between players.

```text
PLAYER
 ↓
WORK
 ↓
INCOME
 ↓
SPENDING
 ↓
BUSINESSES
 ↓
EMPLOYEES
 ↓
SUPPLIERS
 ↓
OTHER BUSINESSES
 ↓
PLAYERS
```

The economy should avoid simply giving players money from nowhere.

Whenever possible:

> **Money should have a source and a destination.**

---

# 7. Supply and Demand

Prices should respond to the simulated economy.

Example:

There are:

```text
10,000 residents
500 apartments
```

Housing demand becomes high.

Apartment prices increase.

Developers notice.

They buy land.

They construct apartments.

Housing supply increases.

Prices stabilize.

This creates an economic feedback loop.

---

# 8. Player Businesses

Players can eventually create companies.

Example:

## Favour Logistics

```text
Owner
Employees
Vehicles
Warehouses
Customers
Suppliers
Revenue
Expenses
Loans
Reputation
```

The company can grow from:

```text
1 person
   ↓
3 employees
   ↓
20 employees
   ↓
100 employees
   ↓
Multiple branches
```

A company is not simply a menu.

It should exist in the city.

The company can own:

- Offices
- Shops
- Warehouses
- Vehicles
- Factories
- Apartments
- Land

---

# 9. Supply Chains

Businesses depend on other businesses.

Example:

```text
FARM
 ↓
FOOD PROCESSOR
 ↓
WAREHOUSE
 ↓
LOGISTICS COMPANY
 ↓
RESTAURANT
 ↓
CUSTOMER
```

A disruption in one part of the chain can affect everything downstream.

Example:

Fuel prices increase.

↓

Transport costs increase.

↓

Food delivery becomes more expensive.

↓

Restaurant expenses increase.

↓

Food prices increase.

↓

Players change their spending.

The economy reacts.

---

# 10. Property

Land should be one of the most important long-term assets.

Players can:

- Buy land
- Sell land
- Rent land
- Build on land
- Develop property
- Rent buildings
- Renovate buildings
- Sell buildings

Property types:

```text
Apartment
Shop
Office
Warehouse
Restaurant
Hotel
Factory
School
Hospital
Entertainment
```

A player can begin with:

> "I need somewhere to live."

and eventually reach:

> "I own half a block."

---

# 11. City Development

Players should gradually build the city.

The game begins with relatively undeveloped districts.

Players create:

- Businesses
- Apartments
- Roads
- Services
- Entertainment
- Offices
- Industrial areas

Over time:

```text
EMPTY LAND
    ↓
HOUSES
    ↓
SHOPS
    ↓
BUSINESSES
    ↓
DENSE NEIGHBORHOOD
    ↓
CITY DISTRICT
```

The city becomes a historical record of what players did.

---

# 12. The Persistent World

The world does not stop when a player logs out.

When they return:

```text
While you were away...

Your business earned ₦84,000

Your apartment collected ₦120,000 rent

Your employee resigned

A competitor opened nearby

Fuel prices increased

Your property value increased

A new road opened in your district
```

The player should feel:

> **"The world exists without me."**

This is one of the most important aspects of the game.

---

# 13. NPCs

NPCs should exist to make the world feel alive before there are enough players.

NPCs have:

```text
Name
Age
Job
Income
Location
Personality
Needs
Relationships
Schedule
Goals
```

They should move through the city.

Example:

```text
7:00 AM
Commute

8:00 AM
Work

1:00 PM
Lunch

5:00 PM
Return home

7:00 PM
Shop / socialize

11:00 PM
Sleep
```

NPCs can eventually become customers, employees, tenants, suppliers and competitors.

---

# 14. Player Relationships

Players should not only interact economically.

They should be able to:

- Become friends
- Become business partners
- Hire each other
- Compete
- Trade
- Form organizations
- Create communities
- Own businesses together

Social relationships should create actual economic consequences.

Example:

You trust someone.

↓

You give them a business loan.

↓

They successfully repay it.

↓

Trust increases.

↓

You eventually create a company together.

---

# 15. Lagos-Specific Systems

This is where the game gets its identity.

The city should not merely have Nigerian names.

Its systems should feel Nigerian.

### Transportation

- Danfo
- BRT
- Ride-hailing
- Private cars
- Motorcycles where appropriate
- Walking

### Power

- Grid electricity
- Generator
- Solar
- Battery systems

### Fuel

Fuel prices affect:

- Transport
- Businesses
- Logistics
- Manufacturing
- Electricity generation

### Weather

Rain affects:

- Traffic
- Construction
- Transport
- Events
- Outdoor businesses

### Food

Local food businesses should exist throughout the economy.

### Rent

Different neighborhoods have dramatically different property markets.

---

# 16. The Psychology of Engagement

The goal should be:

> **Deep engagement, not psychological exploitation.**

The strongest foundation is the combination of:

### Autonomy

Players feel:

> "I chose this."

Give players multiple viable strategies.

Don't create one optimal path.

---

### Competence

Players should feel:

> "I'm getting better at this."

The game should teach players the economy gradually.

Early:

> Buy low → sell high.

Later:

> Understand supply chains.

Eventually:

> Predict market movements.

The player becomes smarter because they understand the system.

Research on game motivation consistently connects competence and autonomy with enjoyment and continued engagement.

---

### Relatedness

Players should feel:

> "Other people know me."

This comes from:

- Friends
- Employees
- Business partners
- Competitors
- Organizations
- Communities
- Reputation

Research also links avatars, stories and teammates/social interaction with relatedness.

---

# 17. The Most Important Psychological Mechanic: Agency

A player should constantly make meaningful decisions.

Bad:

> Click button → receive ₦10,000.

Good:

> You have ₦100,000.

> What do you do?

```text
Buy stock
Buy land
Start business
Rent better apartment
Learn skill
Save money
Help friend
Take a loan
Travel
```

Then the game remembers what happened.

The player creates their own story.

---

# 18. Uncertainty

The future should never be completely predictable.

Not random nonsense.

Meaningful uncertainty.

Example:

> A new road may be constructed near your property.

That could:

```text
Increase traffic
Increase customers
Increase property value
Increase noise
```

The player doesn't know exactly what will happen.

They have to make decisions under uncertainty.

Research on game enjoyment suggests that uncertainty can be engaging when players are actively trying to understand and reduce it through their decisions.

---

# 19. Consequences

Every major decision should have upside and downside.

Example:

### Take a loan

```text
+₦5,000,000 immediately

BUT

Monthly repayment
Interest
Risk of default
```

### Buy land

```text
-₦3,000,000

Potential:
Property appreciation
Rental income
Development opportunity
```

### Start business

```text
Potential:
Huge income

Risk:
Competition
Operating costs
Employee problems
Demand changes
```

This creates stories naturally.

---

# 20. The "I Wonder What Happens If..." Principle

A player should frequently think:

> "What happens if I do this?"

Examples:

> What if I buy this land?

> What if I raise my prices?

> What if I quit my job?

> What if I hire someone?

> What if I borrow ₦10m?

> What if I move to Lekki?

> What if I open a restaurant here?

That curiosity is one of the game's primary engagement engines.

---

# 21. Long-Term Goals

The game needs goals that take weeks, months or years.

Examples:

### Personal

> Own my first apartment.

### Financial

> Reach ₦10 million.

### Business

> Build a company with 100 employees.

### Property

> Own an entire block.

### Social

> Build the biggest organization.

### City

> Develop an entire district.

### Legacy

> Build something that survives after I stop playing.

This is where the persistent world becomes powerful.

---

# 22. Milestones

Players should be able to look back.

```text
DAY 1
₦50,000
No job
No property

DAY 30
₦240,000
Junior Developer
Shared apartment

DAY 180
₦3,400,000
Senior Developer
Own apartment

DAY 400
₦28,000,000
Business owner
3 properties

DAY 800
₦190,000,000
Company owner
17 employees
```

The player can see their transformation.

---

# 23. City History

The entire server should develop a history.

Example:

```text
YEAR 1

Yaba population: 4,201

YEAR 2

Yaba population: 12,842

YEAR 3

Tech companies increased 340%

YEAR 4

Major transport route completed

YEAR 5

Property values increased 61%
```

The history is generated from actual player activity.

Not scripted lore.

---

# 24. News System

The game can generate a newspaper.

## CITY NEWS

### Housing prices rise in Yaba

Apartment demand increased 28% this month.

### New logistics company opens

SwiftMove has hired 42 workers.

### Fuel prices increase

Transport businesses are adjusting their prices.

### Lekki development project begins

Developers have purchased 84 plots.

Players can become part of the news.

---

# 25. Reputation

Money should not be the only measure of success.

Players can have:

```text
Wealth
Reputation
Influence
Business size
Property
Social network
Skills
```

Someone could be:

> Extremely wealthy but hated.

Another:

> Moderately wealthy but extremely trusted.

Another:

> Poor but incredibly skilled.

This creates different definitions of success.

---

# 26. Competition

Competition should exist without making the entire game a leaderboard.

Players can compete over:

- Market share
- Property
- Business growth
- Reputation
- District development
- Wealth
- Production
- Innovation

Leaderboards should be optional.

Competition can be healthy when it creates meaningful mastery, but research also finds that competition can undermine motivation depending on how it is structured.

---

# 27. Avoid These Engagement Tricks

Do NOT rely on:

- Forced daily logins
- Fake countdowns
- Artificial scarcity
- Gambling-like rewards
- Punishing players for taking breaks
- Deliberately boring "grind" systems
- Pay-to-skip frustration
- Notifications designed to create anxiety

These can create engagement, but they can also become manipulative dark patterns. Recent research specifically identifies temporal, monetary and social manipulation as concerns in game design.

Instead:

> **Make the simulation interesting enough that players want to come back.**

---

# 28. The Return Trigger

The player should return because they are curious.

Not because:

> "You will lose your 500 coins if you don't log in today."

Instead:

> "I wonder what happened to my company."

That is much stronger.

When they return:

```text
Your restaurant gained 12 new customers.

Your competitor lowered their prices.

Your supplier increased costs.

Your employee suggested opening another branch.

Your property increased in value.
```

Now the player wants to investigate.

---

# 29. Emergent Stories

The best stories should not be scripted.

Example:

Player A owns a bakery.

Player B owns a flour company.

Player C owns a logistics company.

Player D owns a supermarket.

Then:

```text
Fuel price ↑
     ↓
Logistics cost ↑
     ↓
Flour price ↑
     ↓
Bakery cost ↑
     ↓
Bread price ↑
     ↓
Customers buy less
     ↓
Bakery revenue ↓
```

One economic event creates a story involving five players.

That is the magic of the game.

---

# 30. AI

AI should NOT control the core economy.

The deterministic game engine controls:

```text
Money
Markets
Inventory
Property
Transactions
Time
Rules
Businesses
Relationships
```

AI handles the expressive layer:

```text
NPC dialogue
News articles
Event descriptions
Business recommendations
Character personalities
Rumors
Storytelling
```

Example:

Game engine:

```json
{
  "event": "fuel_price_increase",
  "percentage": 12,
  "affected": ["transport", "logistics"]
}
```

AI turns that into:

> "Transport operators are already feeling the pressure after another fuel price increase. Several danfo routes have raised fares."

The AI explains the simulation.

It does not decide the simulation.

---

# 31. MVP

Do NOT build the entire city.

Start with one district.

### MVP

```text
1 District
100-500 plots
100 NPCs
20-50 players
10 jobs
10 businesses
Basic property
Basic transport
Basic market
Bank
Inventory
Simple relationships
Day/night cycle
Persistent world
```

The player can:

```text
Work
Earn
Spend
Trade
Buy property
Rent property
Create a business
Hire people
Sell things
Move around
Socialize
```

If that is fun, expand.

---

# 32. Version 2

Add:

```text
Multiple districts
Player companies
Supply chains
Loans
Investments
Advanced property
More transportation
NPC businesses
City events
Reputation
Organizations
```

---

# 33. Version 3

Add:

```text
District development
Player-built infrastructure
Government systems
Taxes
Public services
Elections
Large companies
Advanced markets
Player organizations
International trade
Multiple cities
```

---

# 34. Ultimate Vision

Eventually:

```text
                  WORLD
                    │
          ┌─────────┴─────────┐
          │                   │
        CITY                ECONOMY
          │                   │
     DISTRICTS             MARKETS
          │                   │
       PROPERTY           COMPANIES
          │                   │
      BUILDINGS            PLAYERS
          │                   │
          └─────────┬─────────┘
                    │
                   LIFE
                    │
          JOBS / FRIENDS / HOME
                    │
                 PLAYER
```

The player isn't controlling the city.

The player is **one person inside the city**.

But thousands of players collectively shape what the city becomes.

---

# 35. The North Star

The ultimate question for every feature should be:

> **"Does this create an interesting decision?"**

If yes, build it.

If it only exists to make players click more, reconsider it.

The ideal feeling is:

> "I only came to check my business."

Then:

> "Wait, why did my supplier increase prices?"

Then:

> "Let me check the market."

Then:

> "Oh shit, this new road is going through my district."

Then:

> "I should buy that land."

Then:

> "I need a loan."

Then:

> "I can probably make more money if I build a warehouse."

Then two hours have disappeared.

Not because the game trapped them.

Because **they became genuinely curious about the world they are building.**

That is the kind of "addictive" quality worth designing for.
