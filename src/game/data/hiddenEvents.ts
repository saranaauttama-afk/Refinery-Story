import type { HiddenEventConfig } from '../types'
import { bilingual } from '../translations'

// Hidden Events: gated by the in-game calendar clock (see CALENDAR_BALANCE
// / getGameClock in gameCalculations.ts), optionally combined with an
// in-game state condition. Unlike Hidden Combos (building-adjacency,
// always-discoverable), these can be invisible for a long time and then
// show up as a "???" card once their condition is met -- they stay
// claimable indefinitely once unlocked (no deadline).
//
// Adding more is just adding another entry here -- no other code changes
// needed as long as the reward `kind` matches one already handled by
// claimHiddenEvent() in useGameLoop.ts.
export const HIDDEN_EVENTS: HiddenEventConfig[] = [
  // --- Easy: hour-of-day only, no game condition. Recurs every in-game
  // day (~6 real minutes), so should be found quickly. ---
  {
    key: 'midnightOilContract',
    difficulty: 'easy',
    timeConditions: [{ type: 'hourRange', startHour: 0, endHour: 1 }],
    name: bilingual('Midnight Oil', 'น้ำมันยามเที่ยงคืน'),
    revealMessage: bilingual(
      'A buyer who only does business after midnight found you. Quick, quiet, and surprisingly generous.',
      'ผู้ซื้อที่ทำธุรกิจแค่หลังเที่ยงคืนมาเจอคุณ รวดเร็ว เงียบ และให้ราคาดีเกินคาด',
    ),
    reward: {
      kind: 'contract',
      contract: {
        id: 9001,
        name: bilingual('Midnight Oil Contract', 'สัญญาน้ำมันยามเที่ยงคืน'),
        tier: 1,
        unlockLevel: 1,
        gasolineRequired: 30,
        reward: 600,
        rpReward: 4,
        reputationReward: 2,
      },
    },
  },

  // --- Easy: hour-of-day, alternate window. Same recurrence cadence as
  // above but a building reward instead of a contract, for variety. ---
  {
    key: 'sunriseDelivery',
    difficulty: 'easy',
    timeConditions: [{ type: 'hourRange', startHour: 6, endHour: 7 }],
    name: bilingual('Sunrise Delivery', 'ของส่งยามรุ่งอรุณ'),
    revealMessage: bilingual(
      'A crew showed up at first light with surplus parts for a Crude Tank, free of charge -- no questions asked.',
      'ทีมงานมาตอนแสงแรกพร้อมอุปกรณ์ถังน้ำมันดิบส่วนเกิน ให้ฟรี ไม่ถามอะไรเพิ่ม',
    ),
    reward: { kind: 'building', building: 'crudeTank', uses: 1, costOverride: 0 },
  },

  // --- Medium: specific weekday + a light game condition. Recurs roughly
  // weekly (~42 real minutes) once the building requirement is met. ---
  {
    key: 'fridayPetrochemBuyer',
    difficulty: 'medium',
    timeConditions: [{ type: 'dayOfWeek', day: 5 }],
    gameConditions: [{ type: 'minBuildingCount', building: 'petrochemicalPlant', count: 2 }],
    name: bilingual('Friday Petrochem Buyer', 'ผู้ซื้อปิโตรเคมีวันศุกร์'),
    revealMessage: bilingual(
      'An industrial buyer closes out their week by stocking up -- and they came straight to your gates.',
      'ผู้ซื้อภาคอุตสาหกรรมปิดสัปดาห์ด้วยการกักตุนสินค้า — มาตรงหน้าประตูโรงกลั่นคุณเลย',
    ),
    reward: {
      kind: 'contract',
      contract: {
        id: 9002,
        name: bilingual('Friday Petrochem Order', 'ออเดอร์ปิโตรเคมีวันศุกร์'),
        tier: 2,
        unlockLevel: 1,
        gasolineRequired: 0,
        petrochemicalsRequired: 40,
        reward: 2400,
        rpReward: 10,
        reputationReward: 6,
      },
    },
  },

  // --- Medium: a recurring weekday + refinery-level condition, staff
  // reward this time. ---
  {
    key: 'mondayVeteranOperator',
    difficulty: 'medium',
    timeConditions: [{ type: 'dayOfWeek', day: 1 }],
    gameConditions: [{ type: 'minRefineryLevel', level: 8 }],
    name: bilingual('Monday Morning Veteran', 'ทหารผ่านศึกเช้าวันจันทร์'),
    revealMessage: bilingual(
      'A grizzled operator walks in looking for work on a Monday morning, decades of refinery experience in tow.',
      'ผู้ควบคุมเครื่องจักรหน้าเก๋าเดินเข้ามาหางานในเช้าวันจันทร์ พร้อมประสบการณ์โรงกลั่นหลายสิบปี',
    ),
    reward: { kind: 'staff', workerType: 'operator', name: 'Somchai "The Veteran" Boonsong', startingLevel: 3 },
  },

  // --- Hard: specific day-of-month + a high refinery-level requirement.
  // Recurs roughly monthly (~3 real hours) once the player is far enough
  // into the game, and only for players who keep playing the same save
  // that long. ---
  {
    key: 'firstOfMonthPolymerEngineer',
    difficulty: 'hard',
    timeConditions: [{ type: 'dayOfMonth', day: 0 }],
    gameConditions: [
      { type: 'minRefineryLevel', level: 20 },
      { type: 'minBuildingCount', building: 'polymerPlant', count: 1 },
    ],
    name: bilingual('First-of-the-Month Specialist', 'ผู้เชี่ยวชาญต้นเดือน'),
    revealMessage: bilingual(
      'On the first of the month, a polymer chemist with an impressive resume asks to join your operation.',
      'ต้นเดือน นักเคมีพอลิเมอร์ที่มีประวัติงานน่าประทับใจขอเข้าร่วมทีมของคุณ',
    ),
    reward: { kind: 'staff', workerType: 'polymerEngineer', name: 'Dr. Apinya Chaiyaporn', startingLevel: 4 },
  },

  // --- Easy: weekend + late-morning window. A walk-in surplus lubricant
  // buyer, recurs weekly once found. No game condition, so early players
  // can stumble on it. ---
  {
    key: 'weekendLubricantRun',
    difficulty: 'easy',
    timeConditions: [
      { type: 'dayOfWeek', day: 6 },
      { type: 'hourRange', startHour: 10, endHour: 13 },
    ],
    gameConditions: [{ type: 'minBuildingCount', building: 'lubricantPlant', count: 1 }],
    name: bilingual('Weekend Lubricant Run', 'ออเดอร์สารหล่อลื่นวันหยุด'),
    revealMessage: bilingual(
      'A workshop chain does its restocking on weekends and wants lubricant in bulk — cash on delivery.',
      'เครือร้านซ่อมเติมสต๊อกช่วงวันหยุดและต้องการสารหล่อลื่นจำนวนมาก — จ่ายสดเมื่อส่งของ',
    ),
    reward: {
      kind: 'contract',
      contract: {
        id: 9003,
        name: bilingual('Weekend Lubricant Order', 'ออเดอร์สารหล่อลื่นวันหยุด'),
        tier: 2,
        unlockLevel: 1,
        gasolineRequired: 0,
        lubricantsRequired: 35,
        reward: 1800,
        rpReward: 8,
        reputationReward: 5,
      },
    },
  },

  // --- Medium: mid-month clean-energy grant. Rewards players leaning into
  // ESG (waste treatment) with a free power plant. Recurs monthly. ---
  {
    key: 'midMonthGreenGrant',
    difficulty: 'medium',
    timeConditions: [{ type: 'dayOfMonth', day: 15 }],
    gameConditions: [{ type: 'minBuildingCount', building: 'wasteTreatmentPlant', count: 1 }],
    name: bilingual('Mid-Month Green Grant', 'ทุนพลังงานสะอาดกลางเดือน'),
    revealMessage: bilingual(
      'A clean-energy foundation noticed your waste treatment and shipped you a Power Plant, no strings attached.',
      'มูลนิธิพลังงานสะอาดเห็นระบบบำบัดของเสียของคุณ จึงส่งโรงไฟฟ้าให้ฟรีโดยไม่มีเงื่อนไข',
    ),
    reward: { kind: 'building', building: 'powerPlant', uses: 1, costOverride: 0 },
  },

  // --- Hard: end-of-month night-shift jet-fuel haul. A big-ticket contract
  // for late-game players running jet fuel at scale. Narrow window (late
  // night on the last day of the month) so it stays rare. ---
  {
    key: 'monthEndJetHaul',
    difficulty: 'hard',
    timeConditions: [
      { type: 'dayOfMonth', day: 29 },
      { type: 'hourRange', startHour: 22, endHour: 2 },
    ],
    gameConditions: [
      { type: 'minRefineryLevel', level: 15 },
      { type: 'minBuildingCount', building: 'jetFuelPlant', count: 2 },
    ],
    name: bilingual('Month-End Jet Haul', 'ขนเชื้อเพลิงอากาศยานสิ้นเดือน'),
    revealMessage: bilingual(
      'An airline scrambling to close its quarter needs jet fuel tonight — and will pay a premium for the rush.',
      'สายการบินที่เร่งปิดไตรมาสต้องการเชื้อเพลิงอากาศยานคืนนี้ — และยอมจ่ายแพงเพื่อความเร่งด่วน',
    ),
    reward: {
      kind: 'contract',
      contract: {
        id: 9004,
        name: bilingual('Month-End Jet Order', 'ออเดอร์เชื้อเพลิงอากาศยานสิ้นเดือน'),
        tier: 3,
        unlockLevel: 1,
        gasolineRequired: 0,
        jetFuelRequired: 60,
        reward: 5200,
        rpReward: 18,
        reputationReward: 10,
      },
    },
  },
]
