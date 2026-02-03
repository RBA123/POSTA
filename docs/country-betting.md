# Country-Specific Betting Feature

## Overview

The country-specific betting feature allows users to bet on individual countries within a market rather than just betting Yes/No on the entire market. This is useful for questions like "Which countries will qualify?" where users can bet on each country's chances individually.

## Implementation Summary

### 1. Type Definitions

- **CountryBet Interface**: Defines country-specific odds with `code`, `name`, `flag`, `siProbability`, and `noProbability`
- **Market Interface**: Added optional `countryBets` field to support multi-country markets
- **UserBet & MarketBet Interfaces**: Added optional `countryCode` field to track which country a bet was placed on

### 2. Frontend Implementation

#### CountryBettingScreen

- Displays a list of countries with flags and individual Yes/No betting options
- Shows potential winnings for each bet (default 10¢)
- Users can select a country and bet Yes or No on that specific country
- Location: `/screens/CountryBettingScreen.tsx`

#### MarketCard Updates

- Detects multi-country markets via `countryBets` array
- Displays "🌍 X Países" badge for multi-country markets
- Triggers navigation to CountryBettingScreen when badge is pressed
- Location: `/components/MarketCard.tsx`

#### Bet Service

- Updated `placeBet()` function to accept optional `countryCode` parameter
- Passes country code to Cloud Function for proper probability calculation
- Location: `/services/bet.service.ts`

### 3. Backend Implementation

#### placeBet Cloud Function

- Accepts `countryCode` parameter from client
- Validates country code exists in market's countryBets array
- Calculates probability based on country-specific odds (if countryCode provided) or market-level odds (if not)
- Stores `countryCode` in both UserBet and MarketBet documents
- Location: `/firebase/functions/src/bets/placeBet.ts`

#### createMarket Cloud Function

- Accepts `countryBets` array in market creation data
- Stores country betting options in Firestore
- Location: `/firebase/functions/src/markets/marketScheduler.ts`

### 4. Admin Panel

#### CreateMarketPage

- Checkbox to enable multi-country betting
- UI to add/remove countries with individual probabilities
- Each country requires: code (e.g., "ARG"), name (e.g., "Argentina"), flag emoji (e.g., "🇦🇷"), and Yes/No probabilities
- Location: `/admin/src/pages/CreateMarketPage.tsx`

## Usage Guide

### For Admins: Creating a Multi-Country Market

1. Open the admin panel at `http://localhost:5173`
2. Navigate to "Create Market"
3. Fill in the basic market details (question, category, timing)
4. Check the "Multi-country market" checkbox
5. Add countries one by one:
   - Enter country code (e.g., "ARG")
   - Enter country name (e.g., "Argentina")
   - Enter flag emoji (e.g., "🇦🇷")
   - Set Yes probability (e.g., 70%)
   - Set No probability (e.g., 30%)
   - Click "+ Add Country"
6. Repeat for all countries you want to include
7. Click "Create Market"

### For Users: Betting on a Country

1. Open the mobile app
2. Browse markets on the Home screen
3. Look for markets with the "🌍 X Países" badge
4. Tap the badge to view all countries
5. Scroll through the country list
6. Tap "Sí" or "No" button next to your chosen country
7. See the potential winnings displayed on the button
8. Confirm your bet

## Technical Details

### Data Structure

#### Market Document with Country Bets

```typescript
{
  id: "market123",
  question: "¿Qué países clasificarán?",
  category: "torneos",
  status: "open",
  countryBets: [
    {
      code: "ARG",
      name: "Argentina",
      flag: "🇦🇷",
      siProbability: 70,
      noProbability: 30
    },
    {
      code: "BRA",
      name: "Brasil",
      flag: "🇧🇷",
      siProbability: 80,
      noProbability: 20
    }
  ],
  // ... other market fields
}
```

#### UserBet Document with Country Code

```typescript
{
  id: "bet456",
  userId: "user789",
  marketId: "market123",
  side: "si",
  amount: 10,
  probability: 70,
  potentialWin: 14,
  countryCode: "ARG",
  status: "pending",
  // ... other bet fields
}
```

### Probability Calculation

For country-specific bets, the Cloud Function uses the country's individual probabilities:

- If betting Yes on Argentina with 70% probability: `potentialWin = amount / (70 / 100)`
- If betting No on Argentina with 30% probability: `potentialWin = amount / (30 / 100)`

For regular markets (without countryCode), it uses the market-level probabilities.

### Deployment Status

✅ All Cloud Functions deployed to `porta-main` project
✅ Region: `us-central1`
✅ Functions updated:

- `placeBet` - Handles country-specific bets
- `createMarket` - Creates markets with country options

## Testing Checklist

- [ ] Create a multi-country market from admin panel
- [ ] Verify market appears with "🌍 X Países" badge on mobile app
- [ ] Tap badge and verify all countries are displayed
- [ ] Place a bet on a specific country
- [ ] Verify bet document in Firestore contains `countryCode` field
- [ ] Verify potential winnings are calculated correctly
- [ ] Test with multiple users betting on different countries
- [ ] Test market settlement with country-specific bets

## Future Enhancements

1. **Odds Recalculation**: Update country-specific probabilities based on betting volume
2. **Country Leaderboards**: Show which countries are most popular/profitable
3. **Multi-Country Bet Slips**: Allow users to bet on multiple countries at once
4. **Country-Specific Statistics**: Track performance by country
5. **Dynamic Country Lists**: Allow adding/removing countries after market creation

## Files Modified

### Type Definitions

- `firebase/types/firestore.types.ts` - Added CountryBet interface, updated Market, UserBet, MarketBet

### Frontend

- `screens/CountryBettingScreen.tsx` - Country selection UI
- `components/MarketCard.tsx` - Multi-country badge
- `services/bet.service.ts` - Updated placeBet function
- `types/navigation.ts` - Added CountryBetting navigation type

### Backend

- `firebase/functions/src/bets/placeBet.ts` - Country-specific probability logic
- `firebase/functions/src/markets/marketScheduler.ts` - Country bets in market creation
- `firebase/functions/src/bets/settleBets.ts` - Fixed unused variable warning

### Admin Panel

- `admin/src/pages/CreateMarketPage.tsx` - Country management UI
- `admin/src/services/markets.ts` - Added CountryBet interface to CreateMarketData

## Notes

- Country codes should be unique within a market
- Probabilities for each country are independent (don't need to sum to 100)
- Regular markets can coexist with country markets
- Country betting is optional - markets work the same with or without it
