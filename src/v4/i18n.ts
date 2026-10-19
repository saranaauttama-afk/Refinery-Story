export type Language = 'en' | 'th'
export type LocalizedText = { en: string; th: string }

export const language: Language = 'th'
export const text = (value: LocalizedText): string => value[language]
export const copy = {
  title: { en: 'Refinery Story', th: 'Refinery Story' },
  newGame: { en: 'New Game', th: 'เริ่มเกมใหม่' },
  placeholder: { en: 'v4 – yard coming soon', th: 'v4 – ลานโรงกลั่นกำลังจะมา' },
  back: { en: 'Back to title', th: 'กลับหน้าหลัก' },
} satisfies Record<string, LocalizedText>
