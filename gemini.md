# Project Data Schema & Law

## Raw Input Schema
The application captures user activities and logs them. Here is the JSON Schema representation of the core data objects.

### User Profile Schema
```json
{
  "userId": "usr_local_8742",
  "name": "Jane Doe",
  "joinedDate": "2026-06-17T00:00:00Z",
  "points": 320,
  "level": 2,
  "co2Target": 14.5,
  "currentCo2": 12.8,
  "ecoScore": 82,
  "stats": {
    "transport": 4.8,
    "food": 3.6,
    "energy": 3.2,
    "lifestyle": 1.2
  }
}
```

### Activity Log Schema
```json
{
  "id": "log_987654",
  "timestamp": "2026-06-17T19:56:00Z",
  "category": "transport | food | energy | lifestyle",
  "activity": "Rode electric bike instead of driving",
  "value": 10.0,
  "unit": "km | meal | kWh | count",
  "co2Avoided": 2.1,
  "co2Produced": 0.0,
  "pointsEarned": 25
}
```

### Challenge Schema
```json
{
  "id": "ch_554433",
  "title": "Meatless Weekdays",
  "description": "Eat vegetarian or vegan meals from Monday to Friday.",
  "category": "food",
  "difficulty": "medium",
  "durationDays": 5,
  "pointsReward": 150,
  "co2SavingsEst": 12.5,
  "progress": 60,
  "status": "available | active | completed"
}
```

### Leaderboard Schema
```json
{
  "rank": 1,
  "name": "Alex Green",
  "avatar": "🌿",
  "ecoScore": 96,
  "co2AvoidedTotal": 84.5
}
```

## Processed Output Schema

### Local Coach Response Recommendation
```json
{
  "category": "transport | food | energy | lifestyle",
  "title": "Transition to LED bulbs",
  "description": "Replace 5 halogen bulbs in your living room. Saves approx. 0.15kg CO2 per day.",
  "co2Savings": 0.15,
  "difficulty": "easy",
  "pointsReward": 40
}
```

## System Rules & Constraints
1. **Supportive Language:** The system must never blame or shame the user. All outputs are educational and focused on constructive next-steps.
2. **Relatable Comparisons:** Carbon numbers (kg CO2e) must be presented with real-world analogies (e.g. smartphone charges, tree absorption days).
3. **Data Consistency:** All logs and metrics are managed in local memory and saved to LocalStorage.

## Maintenance Log
- **2026-06-17:** Created data schemas, system rules, and database specifications based on the user's initial answers.
