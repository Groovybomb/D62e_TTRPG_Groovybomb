# D62e Game Orchestration & Mechanics

## Overview

This document describes the D6 Second Edition rules as implemented in the D62e platform, including roll mechanics, result determination, and how the Game Master orchestrates gameplay.

## Roll Types

### Skill Rolls

**Purpose:** Determine success or failure of general character actions (hacking, piloting, diplomacy, etc.)

**Mechanics:**
- Player rolls a pool of six-sided dice based on skill level
- Result determined by number of successes and whether a wild die rolled
- Used for non-combat actions

**Implementation:**
- `RollService.executeSkillRoll(playerId, skillName, diceCount)`
- Returns: Result enum (CRITICAL_SUCCESS, SUCCESS, PARTIAL, FAILURE, CRITICAL_FAILURE)

### Attack Rolls

**Purpose:** Determine if a ranged or melee attack hits its target

**Mechanics:**
- Attacker rolls dice pool based on weapon and relevant skill (shooting, melee, etc.)
- Defender can attempt to dodge with their own roll
- Both rolls resolved; higher result wins
- Ties go to the attacker

**Implementation:**
- `RollService.executeAttackRoll(attackerId, skillName, diceCount, defenderId)`
- Returns: AttackResult { attacker: Result, defender: Result, winner: Player, damageRoll: RollId }

### Damage Rolls

**Purpose:** Determine how much damage a successful attack inflicts

**Mechanics:**
- Only executed after a successful attack
- Damage dice pool determined by weapon type
- Wild dice can increase or decrease damage
- Result determines damage amount

**Implementation:**
- `RollService.executeDamageRoll(weaponId, diceCount)`
- Returns: DamageResult { amount: number, weaponId: string }

## Wild Dice Mechanics

Wild dice (1s rolled) have special properties in D62e:

**Impact on Results:**
- **One wild die:** Can either help or hinder the roll (player choice, or GM discretion if uncontrolled)
- **Multiple wild dice:** Unpredictable effects - may grant additional successes, subtract successes, or trigger special events
- **All dice wild:** Critical event - either tremendous advantage or disadvantage depending on context

**Wild Dice Table:**

| Wild Count | Effect | Result Modifier |
|-----------|--------|-----------------|
| 0 | Normal roll | Standard success count |
| 1 | Controlled chaos | Player may reroll 1 die or add +1 to result |
| 2+ | Uncontrolled | GM determines effect (±2 successes, special event) |
| All dice | Critical event | Major advantage or disadvantage |

**Implementation Notes:**
- `RollService.calculateWildDiceEffect()` evaluates impact
- Wild dice outcomes can be random or player-controlled based on character abilities
- Effects logged in roll result for transparency

## Result Determination

### Success Levels

**CRITICAL_SUCCESS:**
- Exceptional success with lasting positive effects
- Multiple successes rolled, no wild dice complications
- May grant bonuses to subsequent rolls
- Example: Hacking a system perfectly and gaining extra information

**SUCCESS:**
- Standard success, objective achieved
- Minimum success threshold met
- No lasting bonuses or penalties
- Example: Successfully piloting through an obstacle

**PARTIAL:**
- Mixed outcome, objective partially achieved
- Fewer successes than desired, or complicated by wild dice
- May require follow-up actions to fully succeed
- Example: Picking a lock but triggering a minor alarm

**FAILURE:**
- Objective not achieved
- Below success threshold
- May trigger complications
- Example: Failed to convince NPC of your story

**CRITICAL_FAILURE:**
- Catastrophic failure with negative consequences
- All dice are wild, or extremely bad roll
- Creates new obstacles or complications
- Example: Weapon jam, system crash, major accident

### Success Calculation

```
base_successes = count(dice that rolled ≥ [difficulty_threshold])
wild_count = count(dice that rolled 1)
final_result = applyWildDiceEffect(base_successes, wild_count)
result_level = determineResultLevel(final_result, difficulty)
```

Default difficulty threshold: 4+ counts as a success

## Game Master Controls

The Game Master has special capabilities:

**Calling Rolls:**
- `POST /game/session/:sessionId/call-roll`
- Specify: roll type, target character(s), skill, difficulty
- All targeted players roll simultaneously
- Results displayed to all players

**Modifying Rolls:**
- Can add/subtract from roll results (for environmental effects)
- Can override result determination (storytelling purposes)
- Changes logged with explanation

**Game State Management:**
- Start/pause/end game session
- Manage initiative and turn order
- Award or deduct resources (credits, health, etc.)
- Create custom events and complications

## Turn Structure (Optional, for Combat)

If implementing turn-based combat:

1. Initiative Phase - All combatants roll to determine order
2. Action Phase - Each character takes their turn (highest initiative first)
3. Resolution Phase - All actions resolve and damage applies
4. Next Round - Repeat

## Character Advancement

[To be detailed as game progresses]

- Experience points earned through gameplay
- Skill improvements
- Character progression system
- Spaceship upgrades

## Platform Implementation

### Roll Persistence

All rolls stored in database with:
- `rollId` - Unique identifier
- `playerId` - Who rolled
- `rollType` - Skill/Attack/Damage
- `diceRolled` - Array of die values [1-6]
- `wildDiceCount` - Number of 1s rolled
- `baseResult` - Raw success count
- `finalResult` - Result after wild dice
- `resultLevel` - Enum value (CRITICAL_SUCCESS, etc.)
- `timestamp` - When roll occurred
- `sessionId` - Which game session

### Roll Log

The Roll Log displays:
- All rolls made during a session
- Roller's name
- Roll type and result
- Associated chat messages
- Sortable by time or result

### Chat Integration

- Each roll generates a system message in chat
- Players can discuss results in real-time
- Serves as both chat and narrative record

## Future Mechanics to Implement

- [ ] Initiative system for turn-based combat
- [ ] Character resources (health, energy, credits) tracking
- [ ] Advantage/disadvantage modifiers
- [ ] Character special abilities and talents
- [ ] Environmental hazards and complications
- [ ] NPC statuses and conditions
- [ ] Campaign progression system
