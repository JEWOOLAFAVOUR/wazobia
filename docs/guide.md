# Wazobia

## Product & Engineering Specification

> A persistent online Lagos where players live, work, socialize, build businesses, own property, trade with each other, and collectively shape the city.

---

# 1. Product Vision

Build a persistent multiplayer life-and-economy simulation set in a stylized but believable Lagos.

The game combines:

- **Wazobia Life**
- **persistent multiplayer worlds**
- **player-driven economies**
- **city building**
- **social simulation**
- **business ownership**
- **property ownership**
- **real-time multiplayer**
- **emergent player stories**

The important distinction is that this should **not feel like a spreadsheet with a Lagos skin**.

The player should physically inhabit the world.

They should be able to:

- walk around Lagos
- see other players
- enter buildings
- rent or buy a home
- get a job
- earn money
- buy food
- use transportation
- start a business
- hire employees
- buy inventory
- sell products
- interact with other players
- meet friends
- attend events
- visit churches and mosques
- visit clubs and restaurants
- join organizations
- buy property
- develop neighborhoods
- trade with other players
- create businesses
- participate in the city's economy

The world continues to exist when a player logs out.

---

# 2. Core Design Principle

## The World Is The UI

Physical locations should be the primary interface.

Instead of:

> Click "Restaurant" → choose "Eat"

The player should:

> Walk to a restaurant → enter → interact with the restaurant → buy food → eat → leave.

Instead of:

> Click "Bank"

The player should:

> Walk to a bank → enter → use the banking interface.

Instead of:

> Click "Work"

The player should:

> Travel to their workplace → clock in → perform their job activities.

Web dashboards can still exist for complex operations such as:

- company management
- accounting
- property portfolios
- banking
- inventory
- analytics
- business management

But the physical world should remain the primary experience.

---

# 3. Product Layers

The game has three interconnected layers.

```text
┌──────────────────────────────────────────┐
│              PLAYER LIFE                 │
│                                          │
│ homes • jobs • friends • relationships  │
│ food • transport • entertainment        │
│ churches • mosques • clubs • events     │
└────────────────────┬─────────────────────┘
                     │
┌────────────────────▼─────────────────────┐
│                 ECONOMY                  │
│                                          │
│ jobs • businesses • money • banks        │
│ inventory • trade • supply • demand      │
│ property • production • services        │
└────────────────────┬─────────────────────┘
                     │
┌────────────────────▼─────────────────────┐
│                  CITY                    │
│                                          │
│ neighborhoods • roads • buildings       │
│ infrastructure • development • events   │
│ player-created spaces                   │
└──────────────────────────────────────────┘
```

These systems must influence one another.

Example:

```text
Fuel price increases
        ↓
Transport businesses increase prices
        ↓
Commuting becomes more expensive
        ↓
Workers reconsider where they live
        ↓
Demand for nearby housing increases
        ↓
Property prices change
        ↓
Businesses move closer to customers
```

The goal is to create systems that naturally generate stories.

---

# 4. World Model

The city should be persistent.

The world is divided into:

```text
City
 ├── District
 │    ├── Neighborhood
 │    │    ├── Buildings
 │    │    │    ├── Properties
 │    │    │    └── Interiors
 │    │    └── Roads
 │    └── Public Spaces
 └── Infrastructure
```

Initial world:

```text
Lagos
 └── Yaba
      ├── Residential areas
      ├── Commercial streets
      ├── Restaurants
      ├── Shops
      ├── Offices
      ├── Bank
      ├── University
      ├── Church
      ├── Mosque
      ├── Club
      ├── Transport stops
      ├── Parks
      └── Player housing
```

Do not attempt to model the entire Lagos metropolis initially.

Start with one highly polished district.

---

# 5. 3D World

The game should use a real 3D environment.

Players should see:

- roads
- buildings
- vehicles
- shops
- houses
- pedestrians
- other players
- signs
- trees
- street infrastructure
- public spaces

Buildings should be actual 3D objects.

Example:

```text
Building
 ├── exterior model
 ├── position
 ├── dimensions
 ├── building type
 ├── owner
 ├── property records
 └── interior
```

Buildings should not simply be UI buttons floating over a map.

---

# 6. Frontend Technology

## Primary Stack

```text
Next.js
TypeScript
React
Three.js
React Three Fiber
Rapier
WebSocket client
Tailwind/shadcn for non-game UI
```

### Why React Three Fiber?

The project is simultaneously:

- a web application
- a multiplayer game
- a social platform
- an economy simulator

React Three Fiber allows the 3D world to live naturally inside the React application.

Three.js handles rendering.

Rapier handles browser-side physics where necessary.

The browser is responsible for:

- rendering
- input
- movement prediction
- animation
- camera
- UI
- interpolation
- visual effects

The browser is **not authoritative over game state**.

---

# 7. Backend Technology

## Recommended Backend

# Go

Use Go for the authoritative game backend.

Recommended stack:

```text
Go
├── HTTP API
├── WebSockets
├── PostgreSQL
├── Redis
├── background workers
└── simulation engine
```

Recommended Go libraries:

```text
net/http
chi
pgx
sqlc
go-redis
gorilla/websocket OR nhooyr/websocket
```

Do not introduce a large framework unless there is a clear reason.

Prefer standard Go patterns.

---

# 8. Why Go Instead of Node.js?

Node.js would absolutely work.

For an MVP:

```text
Next.js
+
Node/NestJS
+
PostgreSQL
+
Redis
```

would be completely reasonable.

However, this project has several characteristics that make Go attractive:

### Realtime connections

Potentially thousands of WebSocket connections.

### Concurrent world activity

Many players can simultaneously:

- move
- chat
- trade
- buy items
- enter buildings
- interact with businesses

### Background simulation

The server may continuously process:

- NPC activity
- production
- supply
- demand
- business operations
- rent
- salaries
- events
- transportation
- market changes

### Economy transactions

Money and inventory need strong server-side guarantees.

### Long-running processes

The world server will continuously run rather than simply handling short HTTP requests.

Go's concurrency model is particularly comfortable for this kind of workload.

---

# 9. Important: Do Not Build Microservices

Do NOT start with:

```text
Auth Service
Player Service
Economy Service
Property Service
Business Service
World Service
Chat Service
Inventory Service
Event Service
Notification Service
```

That is unnecessary complexity.

Start with:

```text
                ┌──────────────────┐
                │      Browser     │
                │                  │
                │ Next.js + R3F    │
                └────────┬─────────┘
                         │
                  HTTPS / WebSocket
                         │
                ┌────────▼─────────┐
                │   Go Backend     │
                │                  │
                │ modular monolith │
                └───────┬───┬──────┘
                        │   │
              ┌─────────┘   └──────────┐
              ▼                        ▼
       ┌─────────────┐          ┌─────────────┐
       │ PostgreSQL  │          │    Redis    │
       │             │          │             │
       │ persistence │          │ realtime    │
       │ economy     │          │ presence    │
       │ world       │          │ cache       │
       └─────────────┘          └─────────────┘
```

Keep domain boundaries clean inside the Go application.

Later, if one subsystem genuinely needs to scale independently, extract it.

---

# 10. Backend Domain Structure

Recommended structure:

```text
backend/

cmd/
  server/
    main.go

internal/

  auth/
  player/
  world/
  movement/
  presence/
  chat/
  economy/
  inventory/
  business/
  property/
  banking/
  jobs/
  transport/
  events/
  social/
  organizations/
  simulation/

  infrastructure/
    postgres/
    redis/
    websocket/

  platform/
    config/
    logging/
    metrics/
```

Do not organize everything around generic:

```text
controllers/
services/
repositories/
models/
```

for the entire application.

Organize around business domains.

---

# 11. Server Authority

The server owns all important game state.

The client must never directly decide:

```text
player.money = 1000000
```

or:

```text
property.owner = player
```

or:

```text
inventory.add(...)
```

The client sends an intent:

```json
{
  "type": "BUY_ITEM",
  "shopId": "shop_123",
  "itemId": "bread"
}
```

The server validates:

```text
Is player alive?
Is player close enough?
Does shop exist?
Is shop open?
Does player have enough money?
Is inventory available?
Is the price current?
```

Then the server performs the transaction.

---

# 12. Economy

The economy is one of the most important systems.

Avoid an economy where the server simply creates infinite money.

Money should primarily move between:

- players
- businesses
- employees
- landlords
- banks
- organizations

The server can introduce money through carefully designed sources such as:

- wages from system/NPC jobs
- government/public-sector systems
- NPC businesses
- economic rewards

But money sinks must also exist:

- rent
- food
- transportation
- utilities
- taxes
- business expenses
- repairs
- entertainment
- property costs

---

# 13. Economy Model

Example:

```text
PLAYER
  │
  ├── earns salary
  │
  ▼
BANK ACCOUNT
  │
  ├── rent
  ├── food
  ├── transport
  ├── entertainment
  └── purchases
```

Businesses:

```text
Business
  │
  ├── revenue
  ├── employees
  ├── inventory
  ├── suppliers
  ├── rent
  ├── utilities
  └── taxes
```

Supply chain:

```text
Supplier
   ↓
Wholesaler
   ↓
Restaurant
   ↓
Customer
```

The same product may therefore have a meaningful economic history.

---

# 14. Financial Transactions

Never implement money changes as:

```sql
UPDATE players
SET balance = balance - 5000
```

without an accompanying transaction record.

Use a ledger.

Example:

```text
accounts
ledger_entries
transactions
```

Example transaction:

```text
Transaction
 ├── id
 ├── type
 ├── reference
 ├── status
 ├── created_at
 └── metadata
```

Ledger:

```text
Ledger Entry
 ├── transaction_id
 ├── account_id
 ├── amount
 ├── currency
 ├── direction
 └── created_at
```

Financial operations must be atomic.

Example:

```text
BEGIN

debit player
credit business
record transaction

COMMIT
```

If anything fails:

```text
ROLLBACK
```

This prevents money duplication.

---

# 15. Inventory

Inventory should also be server authoritative.

Example:

```text
player_inventory
business_inventory
warehouse_inventory
```

Items can have:

```text
item_id
quantity
quality
purchase_price
acquisition_source
location
```

For physical goods, consider location.

A business in Yaba should not magically sell an inventory item located in Ikeja.

---

# 16. Jobs

Players can have jobs.

Initial jobs:

```text
Software Developer
Teacher
Driver
Shop Worker
Restaurant Worker
Accountant
Security Guard
Mechanic
Delivery Driver
Salesperson
Freelancer
```

Jobs should eventually become more than:

```text
Click "Work"
wait 30 seconds
receive ₦5,000
```

Instead, jobs should create interactions.

For example:

```text
Delivery Driver

Accept delivery
     ↓
Collect package
     ↓
Navigate Lagos
     ↓
Deliver package
     ↓
Receive payment
```

This creates a relationship between:

- transportation
- economy
- geography
- time
- player skill

---

# 17. Businesses

Players should eventually own businesses.

Examples:

```text
Restaurant
Bar
Clothing Store
Tech Company
Supermarket
Mechanic
Transport Company
Delivery Company
Construction Company
Real Estate Company
Consulting Company
Media Company
```

Business entity:

```text
Business
 ├── owner
 ├── employees
 ├── location
 ├── cash
 ├── bank account
 ├── inventory
 ├── suppliers
 ├── products
 ├── pricing
 ├── reputation
 └── operating state
```

---

# 18. Player-Driven Market

Players should be able to determine prices.

Example:

```text
Restaurant A
Jollof: ₦2,500

Restaurant B
Jollof: ₦3,000

Restaurant C
Jollof: ₦2,000
```

Players choose based on:

- price
- distance
- reputation
- quality
- availability
- social recommendations

Demand should influence the economy.

---

# 19. Property

Players can:

- rent apartments
- buy homes
- rent commercial buildings
- buy commercial property
- own land
- develop property

Property should have:

```text
property_id
building_id
owner_id
tenant_id
type
price
rent
status
location
```

Later:

```text
property development
renovation
construction
leasing
mortgages
property management
```

---

# 20. Persistent World

The world should continue while players are offline.

Example:

Player A owns a restaurant.

They log out.

While offline:

```text
employees continue working
customers continue visiting
inventory continues changing
rent continues accumulating
revenue continues accumulating
```

When the player returns:

```text
Your restaurant generated ₦184,000
Inventory decreased by 73 units
Rent of ₦40,000 is due
12 customers visited
```

However, avoid simulating every NPC every second while nobody is watching.

Use **time-based simulation**.

Instead of:

```text
simulate 8 hours × every NPC × every second
```

calculate state transitions based on elapsed time.

---

# 21. Simulation Engine

The backend should contain a simulation subsystem.

Example:

```text
simulation/
 ├── scheduler
 ├── economy
 ├── businesses
 ├── transport
 ├── NPCs
 ├── events
 └── world
```

Simulation jobs might include:

```text
processBusiness()
processRent()
processSalary()
processInventory()
processMarket()
processNPC()
processEvents()
```

Use scheduled/background workers.

Do not run everything inside WebSocket handlers.

---

# 22. Realtime Multiplayer

WebSockets should handle:

- player presence
- movement updates
- chat
- nearby interactions
- notifications
- events
- live market updates
- business activity

Example:

```text
Browser
   │
   │ WebSocket
   ▼
Go WebSocket Gateway
   │
   ├── presence
   ├── chat
   ├── world events
   └── nearby players
```

---

# 23. Presence

Do not constantly write player presence into PostgreSQL.

Use Redis.

Example:

```text
presence:user:123
```

Data:

```json
{
  "status": "online",
  "district": "yaba",
  "x": 120,
  "y": 0,
  "z": 54,
  "lastSeen": 1720000000
}
```

Use TTL/heartbeats.

Example:

```text
client heartbeat
      ↓
Redis TTL refreshed
      ↓
heartbeat stops
      ↓
TTL expires
      ↓
player considered offline
```

PostgreSQL stores durable data.

Redis stores fast-changing state.

---

# 24. Interest Management

Never send every player's position to every connected client.

If 2,000 players are online:

```text
Player A
```

does not need updates about:

```text
Player #1,742
Player #1,743
Player #1,744
...
```

Instead, partition the world.

Example:

```text
Yaba
 ├── zone-a
 ├── zone-b
 ├── zone-c
 └── zone-d
```

Players receive updates primarily for their current interest area.

This dramatically reduces network traffic.

---

# 25. Movement

Movement should be responsive.

Client:

```text
input
 ↓
local movement prediction
 ↓
render immediately
```

Server:

```text
receive movement
 ↓
validate
 ↓
authoritative position
```

Server periodically sends corrections if necessary.

Do not send every animation frame to PostgreSQL.

---

# 26. Chat

Initial chat channels:

```text
Global
Local
Nearby
Business
Organization
Event
Private
Friends
```

Proximity chat:

```text
Player A
     ↓
radius
     ↓
Player B
Player C
Player D
```

Only players within the relevant radius receive the message.

Voice chat can be added later.

Do not build voice chat first.

---

# 27. Social System

Social interaction is a major part of the game.

Players should be able to:

- make friends
- follow players
- chat
- form groups
- create organizations
- join clubs
- attend events
- create events
- build reputations
- own social spaces

Examples:

```text
Developer Club
Football Club
Photography Club
University Group
Neighborhood Association
Business Association
```

---

# 28. Real-World Social Spaces

The city should contain:

```text
Churches
Mosques
Clubs
Restaurants
Cafés
Bars
Gyms
Parks
Cinemas
Sports centers
Event venues
Universities
Tech hubs
Markets
```

These should not simply exist as decorative buildings.

They should provide social contexts.

For example:

```text
Church
 ├── services
 ├── community events
 ├── volunteering
 ├── social interaction
 └── organizations

Club
 ├── nightlife
 ├── music
 ├── events
 ├── social interaction
 └── player-owned businesses
```

---

# 29. Events

Players and organizations should eventually create events.

Examples:

```text
Concert
Football Match
Tech Meetup
Wedding
Birthday
Graduation
Cultural Festival
Gaming Tournament
Art Exhibition
Business Conference
```

Event system:

```text
Event
 ├── creator
 ├── venue
 ├── date
 ├── capacity
 ├── ticket price
 ├── attendees
 ├── staff
 ├── vendors
 └── status
```

Player-created events should interact with the economy.

A concert might require:

```text
Venue
Security
Food
Transportation
Musicians
Marketing
Tickets
Staff
```

---

# 30. Transportation

Lagos transportation should be part of the simulation.

Possible systems:

```text
Danfo
BRT
Ride-hailing
Private cars
Motorcycles
Walking
```

Transportation businesses can emerge.

Example:

```text
Fuel price increases
       ↓
Transport costs increase
       ↓
Ticket prices increase
       ↓
Players spend more commuting
       ↓
Demand for nearby housing changes
```

This is the kind of systemic interaction the game should produce.

---

# 31. Lagos-Specific Systems

The city should feel like Lagos.

Potential systems:

### Electricity

```text
Grid availability
Generators
Fuel
Business operating costs
```

### Weather

```text
Rain
Heat
Flooding
Traffic impact
Outdoor event impact
```

### Transport

```text
Traffic
Danfo
BRT
Ride-hailing
Fuel
Road conditions
```

### Housing

```text
Rent
Neighborhood differences
Roommates
Property ownership
```

### Food

```text
Restaurants
Street food
Markets
Groceries
```

### Social life

```text
Churches
Mosques
Clubs
Events
Football
Tech communities
Cultural events
```

These systems should affect gameplay rather than merely appear as cosmetic references.

---

# 32. NPCs

NPCs should support the economy and make the city feel alive.

Examples:

```text
Shopkeeper
Driver
Teacher
Security Guard
Restaurant Worker
Mechanic
Customer
Pedestrian
Business Owner
```

NPCs can:

- work
- travel
- buy things
- visit businesses
- attend events
- create demand
- react to prices
- form routines

However, NPC simulation should remain lightweight.

Do not create an expensive AI model call for every NPC.

---

# 33. AI

AI should be added after the core simulation works.

Possible uses:

### NPC dialogue

Players can talk to selected NPCs.

### Dynamic events

AI can help generate:

```text
local stories
business opportunities
news
rumors
events
```

### Business assistant

Players could eventually ask:

> Why did my restaurant revenue drop?

The system can inspect actual business data and explain:

```text
Customer visits decreased 18%.

Possible contributing factors:

- competitor opened nearby
- food price increased
- rain reduced evening traffic
- inventory shortage occurred
```

AI should reason over real game state.

It should not invent game state.

---

# 34. Database

Use PostgreSQL as the source of truth for durable state.

Core tables will eventually include:

```text
users
players
player_profiles

accounts
ledger_entries
transactions

items
inventories
inventory_items

districts
zones
buildings
properties

businesses
business_employees
business_products

jobs
employment

events
event_attendees

organizations
organization_members

friendships
messages

vehicles
transport_routes

world_state
```

Do not create every table immediately.

Create schemas as vertical slices are implemented.

---

# 35. Redis

Redis should be used for:

```text
presence
sessions
WebSocket state
pub/sub
cache
rate limiting
temporary locks
short-lived world state
job queues
```

Redis is not the permanent source of truth for financial state.

---

# 36. Concurrency and Money Safety

The economy must assume concurrent requests.

Example:

Player has:

```text
₦10,000
```

They attempt to buy two items simultaneously:

```text
Request A: ₦8,000
Request B: ₦8,000
```

The backend must prevent:

```text
₦16,000 spent from ₦10,000
```

Use PostgreSQL transactions and appropriate locking/constraints.

Never rely on:

```text
if balance >= price
```

alone.

The check and mutation must be atomic.

---

# 37. Idempotency

Important financial operations should support idempotency.

Example:

```text
POST /transactions
Idempotency-Key: abc123
```

If the client retries because of a network failure, the server must not charge the player twice.

This is mandatory for:

- purchases
- transfers
- rent
- payroll
- ticket purchases
- property transactions

---

# 38. Authentication

Use normal web authentication.

Do not create a complicated authentication system initially.

Possible architecture:

```text
Access token
Refresh/session mechanism
Secure HTTP-only cookie
```

Keep authentication separate from game state.

---

# 39. API

Use HTTP APIs for durable operations.

Examples:

```http
GET /api/player
GET /api/buildings/:id
GET /api/businesses/:id
POST /api/businesses
POST /api/purchases
POST /api/properties/:id/rent
POST /api/events
```

Use WebSockets for realtime operations.

```text
HTTP
 ├── purchases
 ├── property
 ├── business management
 ├── profile
 └── durable state

WebSocket
 ├── movement
 ├── presence
 ├── chat
 ├── live events
 └── realtime updates
```

Do not put every operation into WebSockets.

---

# 40. API Design Principle

Commands should express intent.

Good:

```text
POST /shops/:id/purchase
```

Bad:

```text
POST /players/:id/setBalance
```

Good:

```text
POST /properties/:id/rent
```

Bad:

```text
PUT /players/:id/property
```

The client requests an action.

The server decides whether the action is valid.

---

# 41. Observability

Build observability from the beginning.

Track:

```text
HTTP latency
WebSocket connections
WebSocket messages/sec
database latency
Redis latency
transaction failures
economy errors
player sessions
simulation processing time
CPU
memory
GC
```

Use:

```text
OpenTelemetry
Prometheus
Grafana
structured logging
```

Initially, even simple logs + metrics are sufficient.

---

# 42. Scaling Model

Do not confuse:

```text
10,000 registered players
```

with:

```text
10,000 concurrent players
```

The second is significantly harder.

Design initial architecture around something like:

```text
100 concurrent
↓
500 concurrent
↓
2,000 concurrent
↓
10,000+ concurrent
```

Scale based on measurements.

---

# 43. Horizontal Scaling

When one Go server is no longer sufficient:

```text
                Load Balancer
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      Go Server   Go Server   Go Server
          │           │           │
          └───────────┼───────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
        PostgreSQL           Redis
```

Realtime servers should use Redis/pub-sub or another coordination mechanism when players can connect to different backend instances.

---

# 44. World Sharding

At larger scale, the world can be divided into zones.

Example:

```text
Lagos
│
├── Yaba
├── Ikeja
├── Lekki
├── Surulere
├── Victoria Island
└── Mainland
```

Each zone can eventually have its own realtime simulation process.

Players entering a zone connect to that zone's simulation.

Do not implement this until the single-server architecture actually requires it.

---

# 45. Game Loop

The basic player loop:

```text
Explore
  ↓
Find opportunities
  ↓
Work / trade / socialize
  ↓
Earn money
  ↓
Spend or invest
  ↓
Improve life
  ↓
Build relationships
  ↓
Own things
  ↓
Build something
  ↓
Influence the city
  ↓
Create stories
```

The deeper loop:

```text
"I want something"
        ↓
"I need resources"
        ↓
"I need to make a decision"
        ↓
"I take action"
        ↓
"The world changes"
        ↓
"Other players react"
        ↓
"I adapt"
```

---

# 46. Player Progression

Avoid a simple:

```text
Level 1
Level 2
Level 3
Level 4
```

progression system.

Progression should primarily come through:

```text
money
skills
relationships
reputation
property
businesses
knowledge
ownership
social influence
```

A player should be able to become successful in different ways.

Examples:

```text
Successful Restaurant Owner
Successful Developer
Successful Driver
Successful Property Investor
Successful Event Organizer
Successful Trader
Successful Musician
Successful Freelancer
```

---

# 47. Identity

Players should develop an identity naturally.

Their profile might eventually show:

```text
Name
Occupation
Businesses
Properties
Organizations
Friends
Achievements
Reputation
Events
```

But identity should mostly come from what they actually do.

---

# 48. Social Reputation

Reputation can eventually influence:

```text
businesses
jobs
events
organizations
property
relationships
```

Example:

A player who repeatedly runs successful events may become known as an event organizer.

A business that consistently provides good service may gain reputation.

Avoid turning reputation into a single simplistic number too early.

---

# 49. Engagement Philosophy

The goal is deep engagement, not manipulative addiction.

The game should create:

### Curiosity

> What happened while I was away?

### Ownership

> That's my restaurant.

### Agency

> I caused this.

### Competence

> I'm getting better at running this business.

### Social connection

> People know me here.

### Identity

> This is the life I built.

### Legacy

> This neighborhood exists partly because of what I built.

Avoid:

- fake scarcity
- forced daily logins
- gambling-like monetization
- punishing players for taking breaks
- artificial grind
- manipulative notifications

The strongest engagement should come from meaningful systems.

---

# 50. MVP

Do NOT build the entire game initially.

Build one district.

## MVP 0

The player can:

```text
Create account
     ↓
Enter Yaba
     ↓
Walk around
     ↓
See buildings
     ↓
See another player
     ↓
See player movement
     ↓
Chat
     ↓
Enter one building
     ↓
Buy food
     ↓
See money decrease
     ↓
Return home
     ↓
Log out
     ↓
Log back in
```

If this feels good, the project has a foundation.

---

# 51. MVP 1

Add:

```text
Jobs
Money
Inventory
Housing
Basic businesses
Basic transportation
Bank
NPCs
```

Player loop:

```text
Wake up
 ↓
Leave home
 ↓
Travel
 ↓
Work
 ↓
Earn
 ↓
Eat
 ↓
Socialize
 ↓
Return home
```

---

# 52. MVP 2

Add:

```text
Player-owned businesses
Property ownership
Player trading
Organizations
Events
Social profiles
Friendships
More buildings
More transportation
```

---

# 53. MVP 3

Add:

```text
Supply chains
Advanced market
Property development
Player-created venues
Player-created events
Advanced businesses
Neighborhood development
Dynamic city economy
```

---

# 54. MVP 4

Eventually:

```text
Multiple Lagos districts
City infrastructure
Government systems
Advanced NPC simulation
Advanced AI
Player organizations
City-wide events
Large-scale world simulation
```

---

# 55. Recommended Development Order

Build in this order.

## Phase 1 — Foundation

```text
Repository
Docker
PostgreSQL
Redis
Go backend
Next.js frontend
Authentication
Basic CI
```

## Phase 2 — 3D World

```text
Three.js
React Three Fiber
Camera
Character
Movement
Collision
Buildings
Yaba map
```

## Phase 3 — Multiplayer

```text
WebSocket
Presence
Player synchronization
Interest management
Chat
```

## Phase 4 — Economy

```text
Player wallet
Ledger
Items
Inventory
Shop
Purchasing
```

## Phase 5 — Life

```text
Housing
Food
Jobs
Transport
Daily routines
```

## Phase 6 — Businesses

```text
Businesses
Employees
Inventory
Suppliers
Revenue
Expenses
```

## Phase 7 — Social

```text
Friends
Organizations
Events
Clubs
Churches
Mosques
Nightlife
```

## Phase 8 — Persistent Simulation

```text
Workers
NPCs
Market
Business simulation
Offline progression
World events
```

## Phase 9 — Scale

Only after measuring actual bottlenecks:

```text
Horizontal backend scaling
Realtime server scaling
Zone servers
Database optimization
Read replicas
Caching
Advanced queues
```

---

# 56. Project Repository

Recommended structure:

```text
wazobia/

├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── game/
│   │   │   ├── world/
│   │   │   ├── player/
│   │   │   ├── buildings/
│   │   │   ├── camera/
│   │   │   └── networking/
│   │   └── lib/
│   │
│   └── server/
│       ├── cmd/
│       └── internal/
│
├── packages/
│   ├── protocol/
│   ├── shared-types/
│   └── game-config/
│
├── infra/
│   ├── docker/
│   └── migrations/
│
├── docs/
│
└── README.md
```

---

# 57. Shared Protocol

Frontend and backend need a clearly defined protocol.

Example:

```text
packages/protocol/
```

Define:

```text
PlayerState
Position
MovementUpdate
ChatMessage
PresenceUpdate
BuildingState
InventoryItem
Transaction
```

Do not duplicate protocol definitions randomly across frontend and backend.

---

# 58. Coding Agent Rules

The coding agent must follow these rules.

### Rule 1

Do not rewrite architecture without explicit approval.

### Rule 2

Do not introduce microservices prematurely.

### Rule 3

Do not put business logic inside React components.

### Rule 4

Do not trust the client with money or ownership.

### Rule 5

Do not persist high-frequency movement directly to PostgreSQL.

### Rule 6

Do not broadcast every player update to every player.

### Rule 7

Do not use Redis as the permanent financial source of truth.

### Rule 8

All financial mutations must be transactional.

### Rule 9

Important financial commands must be idempotent.

### Rule 10

Prefer vertical slices over building huge systems upfront.

### Rule 11

Write tests for economy logic.

### Rule 12

Do not add dependencies unless they solve a real problem.

### Rule 13

Do not implement a feature merely because it sounds impressive.

### Rule 14

Measure performance before optimizing.

---

# 59. Vertical Slice Development

Do not tell the coding agent:

> Build the entire Wazobia game.

Instead give it small vertical slices.

Example:

> Implement player authentication, spawn the player inside Yaba, persist the player's position, and render the player in the 3D world.

Then:

> Add WebSocket presence so two browser sessions can see each other's players.

Then:

> Add proximity chat.

Then:

> Add a restaurant building that players can physically enter.

Then:

> Add purchasing using a PostgreSQL transaction and ledger.

Each slice should work end-to-end.

---

# 60. Definition of Done

A feature is not complete merely because code compiles.

For each feature:

```text
Frontend
   ↓
API / WebSocket
   ↓
Domain logic
   ↓
Database
   ↓
Tests
   ↓
Error handling
   ↓
Observability
```

must work.

---

# 61. Testing Strategy

Test critical systems heavily.

Especially:

```text
Economy
Ledger
Inventory
Property ownership
Business ownership
Transactions
Authentication
Permissions
```

Example:

```text
Given ₦10,000

Purchase ₦3,000 item

Expected:
balance = ₦7,000
inventory += 1
ledger contains debit
business account contains credit
```

Also test concurrent purchases.

---

# 62. Security

Assume the client is malicious.

Players can modify browser JavaScript.

Therefore:

Never trust:

```text
client money
client position
client inventory
client ownership
client permissions
client prices
```

Validate everything important server-side.

Add:

```text
rate limiting
authorization
input validation
transaction validation
anti-cheat checks
audit logs
```

---

# 63. Performance Rules

The 3D browser client must avoid unnecessary work.

Use:

```text
LOD
frustum culling
instancing
asset compression
lazy loading
texture optimization
zone loading
interior instancing
```

The server should avoid:

```text
database write per frame
broadcasting entire world state
full-world simulation every tick
```

---

# 64. Important Architecture Principle

There are two different worlds:

## Visual world

Runs primarily in the browser.

```text
3D models
animations
camera
effects
prediction
rendering
```

## Authoritative world

Runs on the backend.

```text
money
inventory
ownership
businesses
property
relationships
transactions
persistent state
simulation
```

The browser displays the world.

The server owns the world.

---

# 65. Long-Term Architecture

Eventually the system may evolve into:

```text
                         ┌──────────────┐
                         │   Browser    │
                         │ Next + R3F   │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                 HTTP API               WebSocket
                    │                       │
                    └───────────┬───────────┘
                                │
                       ┌────────▼────────┐
                       │    Go Core      │
                       │                 │
                       │ Auth            │
                       │ Players         │
                       │ Economy         │
                       │ Businesses      │
                       │ Property        │
                       │ Social          │
                       │ World           │
                       └───────┬─────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
            PostgreSQL       Redis        Workers
                 │             │             │
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                         Simulation
```

At very large scale:

```text
                   Load Balancer
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
    World Node      World Node       World Node
       Yaba           Ikeja            Lekki
        │               │                │
        └───────────────┼────────────────┘
                        │
                 Shared Services
                        │
              PostgreSQL + Redis
```

But this is a future optimization, not the starting architecture.

---

# 66. Technology Decision

## Frontend

| Technology        | Decision          |
| ----------------- | ----------------- |
| Next.js           | Yes               |
| TypeScript        | Yes               |
| React             | Yes               |
| Three.js          | Yes               |
| React Three Fiber | Yes               |
| Rapier            | Yes               |
| Tailwind/shadcn   | Yes for normal UI |
| WebSockets        | Yes               |

## Backend

| Technology    | Decision                  |
| ------------- | ------------------------- |
| Go            | **Recommended**           |
| Node.js       | Viable alternative        |
| NestJS        | Not necessary if using Go |
| PostgreSQL    | **Yes**                   |
| Redis         | **Yes**                   |
| Go workers    | **Yes**                   |
| Microservices | **No initially**          |

## Infrastructure

| Technology     | Decision          |
| -------------- | ----------------- |
| Docker         | Yes               |
| Linux          | Yes               |
| CI/CD          | Yes               |
| OpenTelemetry  | Yes               |
| Prometheus     | Eventually        |
| Grafana        | Eventually        |
| Kubernetes     | **Not initially** |
| Object storage | Eventually        |

---

# 67. Why This Stack

The project needs two different strengths.

### TypeScript

Excellent for:

```text
web UI
React
3D application integration
frontend tooling
shared types
developer experience
```

### Go

Excellent for:

```text
concurrency
WebSockets
long-running processes
simulation
networking
backend services
resource efficiency
```

### PostgreSQL

Excellent for:

```text
durable state
transactions
financial records
relationships
constraints
queries
```

### Redis

Excellent for:

```text
presence
realtime state
cache
pub/sub
temporary state
```

This combination gives the project a strong foundation without requiring a complicated distributed architecture.

---

# 68. First Technical Milestone

Do not start with:

```text
economy
AI
businesses
NPCs
events
property
```

Start here:

## "Two players can enter Yaba and see each other."

Required:

```text
Next.js
React Three Fiber
Go
WebSocket
Redis
PostgreSQL
```

Flow:

```text
Player A logs in
        ↓
Spawn in Yaba
        ↓
Connect WebSocket
        ↓
Register presence
        ↓
Player B logs in
        ↓
Connect WebSocket
        ↓
Server detects both players
        ↓
Player A sees B
        ↓
Player B sees A
        ↓
Both move around
        ↓
Movement synchronizes
```

Once this works reliably, the project has become a real multiplayer world rather than a normal web application.

---

# 69. First Playable Version

The first genuinely playable build should be extremely small.

```text
Yaba
 │
 ├── Street
 ├── Apartment
 ├── Restaurant
 ├── Shop
 ├── Bank
 ├── Church
 ├── Mosque
 ├── Club
 └── Park
```

Player:

```text
Spawn
 ↓
Walk
 ↓
Meet another player
 ↓
Chat
 ↓
Enter restaurant
 ↓
Buy food
 ↓
Money changes
 ↓
Walk home
 ↓
Log out
 ↓
Return later
 ↓
State is still there
```

That is enough for the first milestone.

---

# 70. North Star

The ultimate goal is not:

> Build a Lagos-themed game.

It is:

> Build a persistent online city where players create lives, relationships, businesses, communities, and stories inside a shared economy.

The strongest feature should be the feeling:

> **"This city keeps existing, and I have a place in it."**

Everything else should support that feeling.
