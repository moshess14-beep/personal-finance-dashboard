export const PLATFORMS = [
  { id: 'netflix', label: 'נטפליקס', color: '#E50914' },
  { id: 'disney', label: 'דיסני+', color: '#1140BE' },
  { id: 'yes', label: 'yes+', color: '#8A1FA8' },
  { id: 'appletv', label: 'Apple TV+', color: '#333333' },
  { id: 'amazon', label: 'אמזון פריים', color: '#00A8E1' },
  { id: 'hot', label: 'HOT', color: '#D6001C' },
  { id: 'cellcom', label: 'סלקום tv', color: '#6236FF' },
  { id: 'partner', label: 'פרטנר TV', color: '#00A88E' },
  { id: 'sting', label: 'סטינג TV', color: '#FF6B00' },
]

export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]))

// מיפוי מזהי ספקים של TMDB (JustWatch) לפלטפורמות שלנו
export const TMDB_PROVIDER_MAP = {
  8: 'netflix',
  337: 'disney',
  350: 'appletv',
  2: 'appletv',
  119: 'amazon',
  9: 'amazon',
}
