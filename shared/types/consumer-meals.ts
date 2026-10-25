// Fictional sample listings. These are not real meal providers or availability.
export interface ConsumerMeal {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  meal: string;
  description: string;
  servingTemperature: 'hot' | 'cold' | 'room_temperature' | 'unknown';
  dietaryTags: string[];
  allergens: string[];
  distance: string;
  hours: string;
}
export const CONSUMER_MEALS: ConsumerMeal[] = [
  { id: 'east-village', name: 'East Village Community Table', address: 'Demo location · East Village, New York, NY', lat: 40.7265, lng: -73.9815, meal: 'Vegetable soup & bread', description: 'A hot vegetable soup with carrots, potatoes and beans, served with bread. Vegetarian. Sodium content is not verified.', servingTemperature: 'hot', dietaryTags: ['vegetarian'], allergens: ['Wheat'], distance: '0.6 mi', hours: 'Today · 11 AM – 2 PM' },
  { id: 'lower-east-side', name: 'Lower East Side Welcome Kitchen', address: 'Demo location · Lower East Side, New York, NY', lat: 40.7182, lng: -73.9874, meal: 'Rice bowls & seasonal vegetables', description: 'A hot rice bowl with roasted vegetables, soy sauce and sesame dressing. Vegan. Sodium content is not verified.', servingTemperature: 'hot', dietaryTags: ['vegan', 'vegetarian'], allergens: ['Soybeans', 'Sesame'], distance: '1.1 mi', hours: 'Today · Noon – 3 PM' },
  { id: 'union-square', name: 'Union Square Shared Table', address: 'Demo location · Union Square, New York, NY', lat: 40.7359, lng: -73.9911, meal: 'Chilled lentil salad & fruit', description: 'A chilled lentil salad with cucumber and lemon, plus fresh fruit. Served cold. Vegan. Sodium and cross-contact information are not verified.', servingTemperature: 'cold', dietaryTags: ['vegan', 'vegetarian'], allergens: [], distance: '0.8 mi', hours: 'Today · 10 AM – 1 PM' },
];
export interface MealMatch { id: string; match: 'yes' | 'no' | 'unknown'; reason: string }
export interface MealSearchResult { mode: 'gemini'; matches: MealMatch[] }
