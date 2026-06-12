import type {
  BilingualTextValue,
  BuildingType,
  ChoiceEventKey,
  MilestoneKey,
  RandomEventKey,
  ResearchKey,
  WorkerType,
} from './types'

const SERIALIZED_SEPARATOR = '|||TH|||'

export function bilingual(en: string, th: string): BilingualTextValue {
  return { en, th }
}

export function serializeBilingualText(value: BilingualTextValue) {
  return `${value.en}${SERIALIZED_SEPARATOR}${value.th}`
}

export function parseBilingualText(value: string): BilingualTextValue {
  const separatorIndex = value.indexOf(SERIALIZED_SEPARATOR)

  if (separatorIndex === -1) {
    return { en: value, th: '' }
  }

  return {
    en: value.slice(0, separatorIndex),
    th: value.slice(separatorIndex + SERIALIZED_SEPARATOR.length),
  }
}

export function toAriaLabel(value: BilingualTextValue) {
  return `${value.en} / ${value.th}`
}

export const text = {
  app: {
    eyebrow: bilingual('Refinery Story', 'เรื่องราวโรงกลั่น'),
    title: bilingual(
      'Tiny idle refinery, now with a real plant layout.',
      'โรงกลั่นเล็กแบบ idle ที่เริ่มมีผังโรงงานจริงแล้ว',
    ),
    heroCopy: bilingual(
      'Expand a simple 3x3 refinery grid, boost storage with tanks, add distillation units for faster output, and keep the idle loop moving.',
      'ขยายผังโรงกลั่น 3x3 แบบเรียบง่าย เพิ่มความจุด้วยถัง ติดตั้งหน่วยกลั่นให้ผลิตไวขึ้น และทำให้ลูป idle เดินต่อเนื่อง',
    ),
    sections: {
      summary: {
        kicker: bilingual('Header / Summary', 'ส่วนหัว / ภาพรวม'),
        title: bilingual('Main Resources', 'ทรัพยากรหลัก'),
        description: bilingual(
          'Keep your core money, crude, gasoline, and research totals visible at a glance.',
          'ดูยอดเงิน น้ำมันดิบ เบนซิน และคะแนนวิจัยหลักได้ทันทีในจุดเดียว',
        ),
      },
      production: {
        kicker: bilingual('Production Area', 'พื้นที่การผลิต'),
        title: bilingual('Refinery Output', 'กำลังการผลิตของโรงกลั่น'),
        description: bilingual(
          'Run the refinery, watch the current rate, and manage the immediate output loop.',
          'ควบคุมโรงกลั่น ดูอัตราการผลิตปัจจุบัน และจัดการลูปผลผลิตระยะสั้น',
        ),
      },
      grid: {
        kicker: bilingual('Refinery Grid', 'ผังโรงกลั่น'),
        title: bilingual('Plant Layout', 'ผังโรงงาน'),
        description: bilingual(
          'Place buildings, compare bonuses, and shape your 3x3 layout for better efficiency.',
          'วางอาคาร ดูโบนัส และจัดผัง 3x3 เพื่อเพิ่มประสิทธิภาพ',
        ),
      },
      progression: {
        kicker: bilingual('Progression Area', 'พื้นที่ความก้าวหน้า'),
        title: bilingual('Growth Systems', 'ระบบการเติบโต'),
        description: bilingual(
          'Advance through contracts, research, staff, and milestones without losing track of your next goal.',
          'พัฒนาเกมผ่านสัญญา วิจัย พนักงาน และ milestone โดยเห็นเป้าหมายถัดไปชัดเจน',
        ),
      },
      systems: {
        kicker: bilingual('System Area', 'พื้นที่ระบบ'),
        title: bilingual('Support Systems', 'ระบบสนับสนุน'),
        description: bilingual(
          'Monitor events, review the activity log, and manage local saves from one place.',
          'ติดตามเหตุการณ์ ดูบันทึกการทำงาน และจัดการเซฟในจุดเดียว',
        ),
      },
    },
  },
  resources: {
    section: bilingual('Resources', 'ทรัพยากร'),
    money: bilingual('Money', 'เงิน'),
    moneyDescription: bilingual(
      'Used for crude, buildings, staff, and refinery upgrades.',
      'ใช้ซื้อน้ำมันดิบ อาคาร พนักงาน และอัปเกรดโรงกลั่น',
    ),
    research: bilingual('Research Points', 'คะแนนวิจัย'),
    researchDescription: bilingual(
      'Earned from contracts and progression rewards.',
      'ได้รับจากสัญญาและรางวัลความก้าวหน้า',
    ),
    reputation: bilingual('Reputation', 'ชื่อเสียง'),
    reputationDescription: bilingual(
      'Earned from successful contracts and used for reputation reward tiers.',
      'ได้รับจากการทำสัญญาสำเร็จ และใช้ปลดโบนัสรางวัลตามระดับชื่อเสียง',
    ),
    crudeOil: bilingual('Crude Oil', 'น้ำมันดิบ'),
    crudeDescription: bilingual(
      'Crude Tanks raise the storage cap.',
      'ถังน้ำมันดิบช่วยเพิ่มความจุสูงสุด',
    ),
    feedstock: bilingual('Feedstock', 'วัตถุดิบกลั่น'),
    feedstockDescription: bilingual(
      'Distillation Units refine crude into feedstock. Jet fuel, lubricants & petrochemical plants run on it.',
      'หน่วยกลั่นเปลี่ยนน้ำมันดิบเป็นวัตถุดิบกลั่น โรงเชื้อเพลิงอากาศยาน สารหล่อลื่น และปิโตรเคมีใช้สิ่งนี้',
    ),
    feedstockRate: (n: number) =>
      bilingual(
        `Distilling +${n} feedstock per cycle. Feeds the advanced plants.`,
        `กลั่นได้ +${n} วัตถุดิบต่อรอบ ป้อนโรงงานขั้นสูง`,
      ),
    feedstockStarved: bilingual(
      'No feedstock — build/feed Distillation Units to supply this plant.',
      'ไม่มีวัตถุดิบกลั่น — สร้าง/ป้อนหน่วยกลั่นเพื่อจ่ายให้โรงงานนี้',
    ),
    gasoline: bilingual('Gasoline', 'น้ำมันเบนซิน'),
    gasolineDescription: bilingual(
      'Product Tanks raise finished fuel storage.',
      'ถังเก็บผลิตภัณฑ์ช่วยเพิ่มความจุเชื้อเพลิงที่ผลิตแล้ว',
    ),
    lubricants: bilingual('Lubricants', 'สารหล่อลื่น'),
    lubricantsDescription: bilingual(
      'Produced by Lubricant Plants. Sell manually for income.',
      'ผลิตจากโรงผลิตสารหล่อลื่น ขายด้วยตนเองเพื่อสร้างรายได้',
    ),
    jetFuel: bilingual('Jet Fuel', 'เชื้อเพลิงอากาศยาน'),
    jetFuelDescription: bilingual(
      'Produced by Jet Fuel Plants. Sell manually for premium income.',
      'ผลิตจากโรงผลิตเชื้อเพลิงอากาศยาน ขายด้วยตนเองเพื่อสร้างรายได้พรีเมียม',
    ),
    petrochemicals: bilingual('Petrochemicals', 'ปิโตรเคมี'),
    petrochemicalsDescription: bilingual(
      'Produced by Petrochemical Plants. Highest-value product.',
      'ผลิตจากโรงผลิตปิโตรเคมี ผลิตภัณฑ์มูลค่าสูงสุด',
    ),
  },
  production: {
    kicker: bilingual('Automation', 'ระบบอัตโนมัติ'),
    title: bilingual('Refinery Floor', 'พื้นที่การกลั่น'),
    status: {
      waiting: bilingual('Waiting for crude', 'รอน้ำมันดิบ'),
      processing: bilingual('Processing', 'กำลังกลั่น'),
      tankFull: bilingual('Product tank full', 'ถังผลิตภัณฑ์เต็ม'),
      idle: bilingual('Idle', 'หยุดทำงาน'),
    },
    progressLabel: bilingual('Auto-production', 'การผลิตอัตโนมัติ'),
    helperTankFull: bilingual(
      'Sell gasoline or build Product Tanks to resume production.',
      'ขายเบนซินหรือสร้าง Product Tank เพื่อให้การผลิตกลับมาทำงานต่อ',
    ),
    helperProducing: (seconds: string) =>
      bilingual(
        `The refinery completes 1 crude every ${seconds}s.`,
        `โรงกลั่นแปรรูปน้ำมันดิบ 1 หน่วยทุก ${seconds} วินาที`,
      ),
    helperNoCrude: bilingual(
      'Buy crude to restart production.',
      'ซื้อน้ำมันดิบเพื่อเริ่มการผลิตต่อ',
    ),
    buyCrude10Button: bilingual('Buy 10 Crude', 'ซื้อน้ำมันดิบ 10 หน่วย'),
    buyCrude50Button: bilingual('Buy 50 Crude', 'ซื้อน้ำมันดิบ 50 หน่วย'),
    fillTankButton: (amount: number) =>
      bilingual(`Fill Tank (+${amount})`, `เติมถัง (+${amount})`),
    buyDisabledTankFull: bilingual('Tank Full', 'ถังเต็มแล้ว'),
    buyDisabledNoFunds: bilingual('No Funds', 'ไม่มีเงิน'),
    sellGasoline10Button: bilingual('Sell 10 Gasoline', 'ขายเบนซิน 10 หน่วย'),
    sellGasoline50Button: bilingual('Sell 50 Gasoline', 'ขายเบนซิน 50 หน่วย'),
    sellGasolineAllButton: (amount: number) =>
      bilingual(`Sell All (${amount})`, `ขายทั้งหมด (${amount})`),
    sellDisabledEmpty: bilingual('No Gasoline', 'ไม่มีเบนซิน'),
    upgradeRefineryButton: (cost: number) =>
      bilingual(`Upgrade Refinery ($${cost})`, `อัปเกรดโรงกลั่น ($${cost})`),
  },
  stats: {
    kicker: bilingual('Current Stats', 'ค่าสถิติปัจจุบัน'),
    title: (level: number) =>
      bilingual(`Refinery Level ${level}`, `ระดับโรงกลั่น ${level}`),
    helper: bilingual(
      'Rate includes all building, research & staff bonuses.',
      'อัตราการผลิตรวมโบนัสจากอาคาร วิจัย และพนักงาน',
    ),
    productionRate: bilingual('Production rate', 'อัตราการผลิต'),
    productionRateValue: (value: string) =>
      bilingual(`${value} gasoline/sec`, `${value} เบนซินต่อวินาที`),
    sellPrice: bilingual('Sell price', 'ราคาขาย'),
    maxCrude: bilingual('Crude cap', 'ความจุน้ำมันดิบ'),
    maxGasoline: bilingual('Gasoline cap', 'ความจุเบนซิน'),
    openCells: bilingual('Grid cells free', 'ช่องตารางว่าง'),
  },
  refineryProgression: {
    kicker: bilingual('Refinery', 'โรงกลั่น'),
    title: bilingual('Level Progression', 'ความก้าวหน้าของระดับ'),
    chainExplainer: bilingual(
      'Crude → Gasoline directly. For advanced products, Distillation Units refine crude into feedstock that jet fuel, lubricant & petrochemical plants consume.',
      'น้ำมันดิบ → เบนซินโดยตรง ส่วนผลิตภัณฑ์ขั้นสูง หน่วยกลั่นจะเปลี่ยนน้ำมันดิบเป็นวัตถุดิบกลั่นที่โรงเชื้อเพลิงอากาศยาน สารหล่อลื่น และปิโตรเคมีใช้',
    ),
    currentLabel: bilingual('Current', 'ปัจจุบัน'),
    nextLabel: (level: number) =>
      bilingual(`Next: Level ${level}`, `ถัดไป: ระดับ ${level}`),
    speedBonus: (ms: number) =>
      bilingual(`Production speed: +${ms}ms`, `ความเร็วการผลิต: +${ms}ms`),
    maxReached: bilingual('All milestones reached.', 'ถึงหมุดหมายสูงสุดแล้ว'),
  },
  buildingEffects: {
    kicker: bilingual('Active Bonuses', 'โบนัสที่ใช้งานอยู่'),
    title: bilingual('Active Effects Summary', 'สรุปเอฟเฟกต์ที่ใช้งานอยู่'),
    noBonuses: bilingual(
      'Place buildings to see active bonuses.',
      'วางอาคารเพื่อดูโบนัสที่ใช้งานอยู่',
    ),
    storageGroup: bilingual('Storage', 'ความจุ'),
    productionGroup: bilingual('Production', 'การผลิต'),
    contractRewardsGroup: bilingual('Contract Rewards', 'รางวัลสัญญา'),
    researchRewardsGroup: bilingual('Research Rewards', 'รางวัลวิจัย'),
    eventProtectionGroup: bilingual('Event Protection', 'การป้องกันเหตุการณ์'),
    crudeBonus: (n: number) =>
      bilingual(`+${n} Max Crude`, `+${n} ความจุน้ำมันดิบสูงสุด`),
    gasolineBonus: (n: number) =>
      bilingual(`+${n} Max Gasoline`, `+${n} ความจุเบนซินสูงสุด`),
    productionBonusPct: (pct: number) =>
      bilingual(`+${pct}% faster production`, `+${pct}% การผลิตเร็วขึ้น`),
    contractRewardBonusPct: (pct: number) =>
      bilingual(`+${pct}% money rewards`, `+${pct}% รางวัลเงิน`),
    rpRewardBonusPct: (pct: number) =>
      bilingual(`+${pct}% research rewards`, `+${pct}% รางวัลวิจัย`),
    penaltyReductionPct: (pct: number) =>
      bilingual(`${pct}% penalty reduced`, `ลดผลเสีย ${pct}%`),
  },
  expansion: {
    kicker: bilingual('Refinery Grid', 'ผังโรงกลั่น'),
    title: bilingual('Grid Expansion', 'การขยายตาราง'),
    currentSize: (n: number) =>
      bilingual(`Current: ${n}×${n}`, `ปัจจุบัน: ${n}×${n}`),
    nextSize: (n: number) =>
      bilingual(`Expand to ${n}×${n}`, `ขยายเป็น ${n}×${n}`),
    expandButton: (cost: number) =>
      bilingual(`Expand Grid ($${cost.toLocaleString()})`, `ขยายตาราง ($${cost.toLocaleString()})`),
    requiresLevel: (level: number) =>
      bilingual(`Requires Refinery Level ${level}`, `ต้องการระดับโรงกลั่น ${level}`),
    locked: bilingual('Locked', 'ล็อก'),
    maxReached: bilingual('Maximum grid size reached.', 'ถึงขนาดตารางสูงสุดแล้ว'),
  },
  combos: {
    kicker: bilingual('Combos', 'คอมโบ'),
    title: bilingual('Active Adjacency Bonuses', 'โบนัสจากการวางติดกัน'),
    crudeDistillationTitle: (count: number) =>
      bilingual(
        `Crude Tank + Distillation Unit x${count}`,
        `ถังน้ำมันดิบ + หน่วยกลั่น x${count}`,
      ),
    crudeDistillationDescription: bilingual(
      '+10% production rate per orthogonal pair.',
      '+10% อัตราการผลิตต่อคู่ที่วางติดกันแนวตรง',
    ),
    distillationProductTitle: (count: number) =>
      bilingual(
        `Distillation Unit + Product Tank x${count}`,
        `หน่วยกลั่น + ถังเก็บผลิตภัณฑ์ x${count}`,
      ),
    distillationProductDescription: bilingual(
      '+10% gasoline sell price per orthogonal pair.',
      '+10% ราคาขายเบนซินต่อคู่ที่วางติดกันแนวตรง',
    ),
    crudeProductTitle: (count: number) =>
      bilingual(
        `Crude Tank + Product Tank x${count}`,
        `ถังน้ำมันดิบ + ถังเก็บผลิตภัณฑ์ x${count}`,
      ),
    crudeProductDescription: bilingual(
      '+10% max crude and max gasoline per orthogonal pair.',
      '+10% ความจุน้ำมันดิบและเบนซินสูงสุดต่อคู่ที่วางติดกันแนวตรง',
    ),
  },
  events: {
    kicker: bilingual('Events', 'เหตุการณ์'),
    title: bilingual('Refinery Events', 'เหตุการณ์โรงกลั่น'),
    lastEvent: bilingual('Last event', 'เหตุการณ์ล่าสุด'),
    noEvent: bilingual('No refinery event yet.', 'ยังไม่มีเหตุการณ์โรงกลั่น'),
  },
  save: {
    kicker: bilingual('Save', 'บันทึก'),
    title: bilingual('Local Save', 'บันทึกในเครื่อง'),
    status: bilingual('Status', 'สถานะ'),
    saveButton: bilingual('Save', 'บันทึก'),
    resetButton: bilingual('Reset Save', 'ล้างเซฟ'),
    ready: bilingual('Save system ready.', 'ระบบบันทึกพร้อมใช้งาน'),
    noSave: bilingual('No local save found.', 'ไม่พบเซฟในเครื่อง'),
    loaded: bilingual('Save loaded from local storage.', 'โหลดเซฟจากเครื่องแล้ว'),
    invalid: bilingual(
      'Save data was invalid. Started a new refinery.',
      'ข้อมูลเซฟไม่ถูกต้อง จึงเริ่มโรงกลั่นใหม่',
    ),
    autosaved: bilingual(
      'Autosaved to local storage.',
      'บันทึกอัตโนมัติลงเครื่องแล้ว',
    ),
    manualSaved: bilingual(
      'Game saved to local storage.',
      'บันทึกเกมลงเครื่องแล้ว',
    ),
    reset: bilingual(
      'Local save reset. Started a new refinery.',
      'ล้างเซฟในเครื่องแล้ว และเริ่มโรงกลั่นใหม่',
    ),
  },
  perks: {
    kicker: bilingual('Upgrades', 'อัปเกรด'),
    title: bilingual('Refinery Upgrades', 'อัปเกรดโรงกลั่น'),
    pointsAvailable: (n: number) =>
      bilingual(
        `${n} upgrade point${n === 1 ? '' : 's'} available`,
        `มีแต้มอัปเกรด ${n} แต้ม`,
      ),
    noPoints: bilingual(
      'Level up the refinery to earn upgrade points.',
      'อัปเลเวลโรงกลั่นเพื่อรับแต้มอัปเกรด',
    ),
    branchEfficiency: bilingual('Efficiency', 'ประสิทธิภาพ'),
    branchCapacity: bilingual('Capacity', 'ความจุ'),
    branchQuality: bilingual('Quality', 'คุณภาพ'),
    costLabel: (n: number) =>
      bilingual(`${n} pt${n === 1 ? '' : 's'}`, `${n} แต้ม`),
    installed: bilingual('Installed', 'ติดตั้งแล้ว'),
    install: bilingual('Install', 'ติดตั้ง'),
    lockedPrereq: bilingual('Locked', 'ถูกล็อก'),
  },
  eras: {
    kicker: bilingual('Tech Era', 'ยุคเทคโนโลยี'),
    currentLabel: bilingual('Current Era', 'ยุคปัจจุบัน'),
    nextLabel: bilingual('Next Era', 'ยุคถัดไป'),
    requirement: (research: number, level: number) =>
      bilingual(
        `Unlock at ${research} research + Level ${level}`,
        `ปลดล็อกที่งานวิจัย ${research} + เลเวล ${level}`,
      ),
    maxReached: bilingual('Highest era reached', 'ถึงยุคสูงสุดแล้ว'),
    bannerTitle: (name: BilingualTextValue) =>
      bilingual(`Entering the ${name.en}`, `เข้าสู่${name.th}`),
  },
  staffTraining: {
    levelLabel: (n: number) => bilingual(`Lv ${n}`, `ระดับ ${n}`),
    maxLevel: bilingual('MAX', 'สูงสุด'),
    xpProgress: (current: number, total: number) =>
      bilingual(`${current} / ${total} XP`, `${current} / ${total} XP`),
    trainButton: (money: number, rp: number) =>
      bilingual(`Train ($${money.toLocaleString()} + ${rp} RP)`, `ฝึก ($${money.toLocaleString()} + ${rp} RP)`),
    bonusLabel: (pct: number) =>
      bilingual(`+${pct}% effectiveness`, `+${pct}% ประสิทธิภาพ`),
  },
  awards: {
    kicker: bilingual('Awards', 'รางวัล'),
    title: bilingual('Annual Awards', 'รางวัลประจำปี'),
    yearProgress: (current: number, total: number) =>
      bilingual(
        `Year ${current} — ${total}% complete`,
        `ปีที่ ${current} — ${total}% ของปี`,
      ),
    thisYear: bilingual('This Year So Far', 'ปีนี้จนถึงตอนนี้'),
    statGasoline: bilingual('Gasoline produced', 'เบนซินที่ผลิต'),
    statMoney: bilingual('Money earned', 'เงินที่หาได้'),
    statContracts: bilingual('Contracts completed', 'สัญญาที่สำเร็จ'),
    statPayroll: bilingual('Annual payroll', 'ค่าจ้างต่อปี'),
    statNet: bilingual('Net profit', 'กำไรสุทธิ'),
    payrollHint: bilingual(
      'Wages are paid at year end. Net profit (after wages) drives your grade.',
      'จ่ายค่าจ้างตอนสิ้นปี กำไรสุทธิ (หลังหักค่าจ้าง) เป็นตัวกำหนดเกรด',
    ),
    unpaidWarning: bilingual(
      'Not enough cash for payroll — reputation took a hit.',
      'เงินไม่พอจ่ายค่าจ้าง — ชื่อเสียงลดลง',
    ),
    projectedGrade: (grade: string) =>
      bilingual(`Projected grade: ${grade}`, `เกรดที่คาดการณ์: ${grade}`),
    history: bilingual('Past Awards', 'รางวัลที่ผ่านมา'),
    noHistory: bilingual(
      'No awards yet — finish your first business year.',
      'ยังไม่มีรางวัล — ทำให้ครบปีธุรกิจแรกก่อน',
    ),
    ceremonyTitle: (year: number) =>
      bilingual(`Year ${year} Awards Ceremony`, `พิธีมอบรางวัลประจำปีที่ ${year}`),
    ceremonyGrade: (grade: string) =>
      bilingual(`Grade ${grade}`, `เกรด ${grade}`),
    ceremonyReward: (cash: number) =>
      bilingual(`Prize: $${cash.toLocaleString()}`, `รางวัล: $${cash.toLocaleString()}`),
    ceremonyClose: bilingual('Continue', 'ดำเนินการต่อ'),
  },
  milestones: {
    kicker: bilingual('Milestones', 'หมุดหมาย'),
    title: bilingual('Progress Goals', 'เป้าหมายความก้าวหน้า'),
    rewardLabel: (reward: string) =>
      bilingual(`Reward: ${reward}`, `รางวัล: ${reward}`),
    completed: bilingual('Completed', 'สำเร็จแล้ว'),
    inProgress: bilingual('In Progress', 'กำลังดำเนินการ'),
    progressBadge: (done: number, total: number) =>
      bilingual(`${done}/${total} complete`, `${done}/${total} สำเร็จ`),
  },
  research: {
    kicker: bilingual('Research', 'วิจัย'),
    title: bilingual('Research Lab', 'ห้องวิจัย'),
    points: (points: number) =>
      bilingual(`RP ${points}`, `RP ${points}`),
    cost: (cost: number) => bilingual(`Cost: ${cost} RP`, `ค่าใช้จ่าย: ${cost} RP`),
    requires: (name: BilingualTextValue) =>
      bilingual(`Requires: ${name.en}`, `ต้องมี: ${name.th}`),
    status: {
      unlocked: bilingual('Unlocked', 'ปลดล็อกแล้ว'),
      ready: bilingual('Ready', 'พร้อมปลดล็อก'),
      locked: bilingual('Locked', 'ถูกล็อก'),
    },
    statusLine: (label: BilingualTextValue) =>
      bilingual(`Status: ${label.en}`, `สถานะ: ${label.th}`),
    unlockButton: bilingual('Unlock', 'ปลดล็อก'),
  },
  staff: {
    kicker: bilingual('Staff', 'พนักงาน'),
    title: bilingual('Refinery Crew', 'ทีมงานโรงกลั่น'),
    count: (count: number) => bilingual(`Count: ${count}`, `จำนวน: ${count}`),
    cost: (cost: number) => bilingual(`Cost: $${cost}`, `ค่าใช้จ่าย: $${cost}`),
    countAndCost: (count: number, cost: number) =>
      bilingual(
        `×${count} hired · $${cost.toLocaleString()} each`,
        `จ้างแล้ว ×${count} · ค่าจ้าง $${cost.toLocaleString()}/คน`,
      ),
    hireButton: bilingual('Hire', 'จ้าง'),
    cantAfford: bilingual("Can't Afford", 'ไม่มีเงินพอ'),
    locked: bilingual('Locked', 'ถูกล็อก'),
    unlockAtLevel: (level: number) =>
      bilingual(
        `Unlock at Refinery Level ${level}`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level}`,
      ),
    tiers: {
      1: bilingual('Basic Staff', 'พนักงานพื้นฐาน'),
      2: bilingual('Operations Staff', 'พนักงานปฏิบัติการ'),
      3: bilingual('Specialist Staff', 'พนักงานเชี่ยวชาญ'),
    },
  },
  workforce: {
    kicker: bilingual('Workforce', 'กำลังแรงงาน'),
    title: bilingual('Active Workforce', 'พนักงานที่ทำงาน'),
    totalStaff: (count: number) => bilingual(`${count} staff`, `${count} คน`),
    noStaff: bilingual('No staff hired yet.', 'ยังไม่มีพนักงาน'),
    bonusOperator: (pct: number) =>
      bilingual(`+${pct}% production speed`, `+${pct}% ความเร็วการผลิต`),
    bonusMechanic: (storage: number) =>
      bilingual(`+${storage} storage cap (crude & gasoline)`, `+${storage} ความจุเก็บน้ำมัน`),
    bonusSalesAgent: (pct: number) =>
      bilingual(`+${pct}% sell price on all products`, `+${pct}% ราคาขายทุกผลิตภัณฑ์`),
    bonusSafetyOfficer: (pct: number) =>
      bilingual(`Event penalties reduced to ${pct}%`, `ลดความเสียหายจากเหตุการณ์เหลือ ${pct}%`),
    bonusChemist: (pct: number) =>
      bilingual(`+${pct}% RP from contracts`, `+${pct}% RP จากสัญญา`),
    bonusLogistics: (pct: number) =>
      bilingual(`+${pct}% crude per shipment`, `+${pct}% น้ำมันดิบต่อการจัดส่ง`),
    bonusFuelSpecialist: (pct: number) =>
      bilingual(`+${pct}% gasoline sell price`, `+${pct}% ราคาขายน้ำมันเบนซิน`),
    bonusAviationSpecialist: (pct: number) =>
      bilingual(`+${pct}% jet fuel production`, `+${pct}% การผลิตเชื้อเพลิงอากาศยาน`),
    bonusChemicalEngineer: (pct: number) =>
      bilingual(`+${pct}% petrochemical production`, `+${pct}% การผลิตปิโตรเคมี`),
  },
  jetFuel: {
    kicker: bilingual('Jet Fuel', 'เชื้อเพลิงอากาศยาน'),
    title: bilingual('Jet Fuel Market', 'ตลาดเชื้อเพลิงอากาศยาน'),
    inventory: (current: number) =>
      bilingual(`Inventory: ${current}`, `คลัง: ${current}`),
    lockedMessage: (level: number) =>
      bilingual(
        `Unlocks at Refinery Level ${level}. Build Jet Fuel Plants to produce jet fuel automatically.`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level} สร้างโรงผลิตเชื้อเพลิงอากาศยานเพื่อผลิตอัตโนมัติ`,
      ),
    noPlants: bilingual(
      'No Jet Fuel Plants placed. Add plants to the grid to begin production.',
      'ยังไม่มีโรงผลิตเชื้อเพลิงอากาศยาน วางโรงผลิตในกริดเพื่อเริ่มการผลิต',
    ),
    priceLabel: (price: number) =>
      bilingual(`$${price} per unit`, `$${price} ต่อหน่วย`),
    sell1Button: bilingual('Sell 1', 'ขาย 1'),
    sell10Button: bilingual('Sell 10', 'ขาย 10'),
    sellAllButton: (amount: number) =>
      bilingual(`Sell All (${amount})`, `ขายทั้งหมด (${amount})`),
    sellDisabledEmpty: bilingual('None to sell', 'ไม่มีสินค้า'),
  },
  lubricants: {
    kicker: bilingual('Lubricants', 'สารหล่อลื่น'),
    title: bilingual('Lubricant Market', 'ตลาดสารหล่อลื่น'),
    lockedMessage: (level: number) =>
      bilingual(
        `Unlocks at Refinery Level ${level}. Build Lubricant Plants to produce lubricants.`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level} สร้างโรงผลิตสารหล่อลื่นเพื่อเริ่มผลิต`,
      ),
    inventory: (current: number) =>
      bilingual(`Inventory: ${current}`, `คลัง: ${current}`),
    priceLabel: (price: number) =>
      bilingual(`$${price} per unit`, `$${price} ต่อหน่วย`),
    sell1Button: bilingual('Sell 1', 'ขาย 1'),
    sell10Button: bilingual('Sell 10', 'ขาย 10'),
    sellAllButton: (amount: number) =>
      bilingual(`Sell All (${amount})`, `ขายทั้งหมด (${amount})`),
    sellDisabledEmpty: bilingual('None to sell', 'ไม่มีสินค้า'),
    noPlants: bilingual(
      'No Lubricant Plants placed. Add plants to the grid to begin production.',
      'ยังไม่มีโรงผลิตสารหล่อลื่น วางโรงผลิตในกริดเพื่อเริ่มการผลิต',
    ),
  },
  jetFuelPlant: {
    kicker: bilingual('Jet Fuel Plant', 'โรงผลิตเชื้อเพลิงอากาศยาน'),
    title: bilingual('Jet Fuel Market', 'ตลาดเชื้อเพลิงอากาศยาน'),
    lockedMessage: (level: number) =>
      bilingual(
        `Unlocks at Refinery Level ${level}. Build Jet Fuel Plants to produce jet fuel automatically.`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level} สร้างโรงผลิตเชื้อเพลิงอากาศยานเพื่อผลิตอัตโนมัติ`,
      ),
    inventory: (current: number) =>
      bilingual(`Inventory: ${current}`, `คลัง: ${current}`),
    priceLabel: (price: number) =>
      bilingual(`$${price} per unit`, `$${price} ต่อหน่วย`),
    sell1Button: bilingual('Sell 1', 'ขาย 1'),
    sell10Button: bilingual('Sell 10', 'ขาย 10'),
    sellAllButton: (amount: number) =>
      bilingual(`Sell All (${amount})`, `ขายทั้งหมด (${amount})`),
    sellDisabledEmpty: bilingual('None to sell', 'ไม่มีสินค้า'),
    noPlants: bilingual(
      'No Jet Fuel Plants placed. Add plants to the grid to begin production.',
      'ยังไม่มีโรงผลิตเชื้อเพลิงอากาศยาน วางโรงผลิตในกริดเพื่อเริ่มการผลิต',
    ),
  },
  petrochemicals: {
    kicker: bilingual('Petrochemicals', 'ปิโตรเคมี'),
    title: bilingual('Petrochemical Market', 'ตลาดปิโตรเคมี'),
    lockedMessage: (level: number) =>
      bilingual(
        `Unlocks at Refinery Level ${level}. Build Petrochemical Plants to produce petrochemicals automatically.`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level} สร้างโรงผลิตปิโตรเคมีเพื่อผลิตอัตโนมัติ`,
      ),
    inventory: (current: number) =>
      bilingual(`Inventory: ${current}`, `คลัง: ${current}`),
    priceLabel: (price: number) =>
      bilingual(`$${price} per unit`, `$${price} ต่อหน่วย`),
    sell1Button: bilingual('Sell 1', 'ขาย 1'),
    sell10Button: bilingual('Sell 10', 'ขาย 10'),
    sellAllButton: (amount: number) =>
      bilingual(`Sell All (${amount})`, `ขายทั้งหมด (${amount})`),
    sellDisabledEmpty: bilingual('None to sell', 'ไม่มีสินค้า'),
    noPlants: bilingual(
      'No Petrochemical Plants placed. Add plants to the grid to begin production.',
      'ยังไม่มีโรงผลิตปิโตรเคมี วางโรงผลิตในกริดเพื่อเริ่มการผลิต',
    ),
  },
  asphalt: {
    kicker: bilingual('Asphalt', 'แอสฟัลต์'),
    title: bilingual('Asphalt Processing', 'การผลิตแอสฟัลต์'),
    inventory: (current: number, max: number) =>
      bilingual(`Asphalt: ${current} / ${max}`, `แอสฟัลต์: ${current} / ${max}`),
    produceButton: (amount: number) =>
      bilingual(
        `Process ×${amount} (${amount} crude)`,
        `แปรรูป ×${amount} (${amount} น้ำมันดิบ)`,
      ),
    lockedMessage: (level: number) =>
      bilingual(
        `Unlocks at Refinery Level ${level}`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level}`,
      ),
    hint: bilingual(
      'Asphalt uses crude from the same supply as gasoline.',
      'แอสฟัลต์ใช้น้ำมันดิบจากคลังเดียวกับเบนซิน',
    ),
    crudeAvailable: (n: number) => bilingual(`Crude available: ${n}`, `น้ำมันดิบคงเหลือ: ${n}`),
    disabledNoCrude: (needed: number) =>
      bilingual(`Need ${needed} crude`, `ต้องการน้ำมันดิบ ${needed} หน่วย`),
    disabledFull: bilingual('Storage full', 'คลังเต็ม'),
    allContractsDone: bilingual(
      'All asphalt contracts fulfilled.',
      'สัญญาแอสฟัลต์ทั้งหมดสำเร็จแล้ว',
    ),
    logProduced: (amount: number) =>
      bilingual(
        `Processed ${amount} crude into asphalt.`,
        `แปรรูปน้ำมันดิบ ${amount} หน่วยเป็นแอสฟัลต์`,
      ),
  },
  standingOrders: {
    sectionTitle: bilingual('Standing Orders', 'คำสั่งซื้อประจำ'),
    restocking: (minutes: number, seconds: number) =>
      bilingual(
        `Restocking — ${minutes}m ${seconds}s`,
        `เติมสต็อก — ${minutes}น ${seconds}วิ`,
      ),
    fulfilled: (name: BilingualTextValue, reward: number) =>
      bilingual(
        `${name.en} order fulfilled. +$${reward.toLocaleString()}`,
        `ส่งมอบคำสั่งซื้อ ${name.th} เรียบร้อย +$${reward.toLocaleString()}`,
      ),
    orders: {
      asphaltMaintenance: {
        name: bilingual('City Road Maintenance Bureau', 'สำนักงานบำรุงรักษาถนนเทศบาล'),
        flavor: bilingual(
          'Standing contract for municipal road repair crews.',
          'สัญญาประจำสำหรับทีมซ่อมบำรุงถนนเทศบาล',
        ),
      },
      jetFuelCharter: {
        name: bilingual('Regional Air Charter Service', 'บริการเช่าเหมาลำอากาศยานภูมิภาค'),
        flavor: bilingual(
          'Standing fuel supply agreement with a regional charter operator.',
          'สัญญาจัดหาเชื้อเพลิงประจำกับผู้ประกอบการเช่าเหมาลำภูมิภาค',
        ),
      },
      lubricantSupply: {
        name: bilingual('Industrial Machinery Cooperative', 'สหกรณ์เครื่องจักรอุตสาหกรรม'),
        flavor: bilingual(
          'Standing lubricant supply agreement with local factories.',
          'สัญญาจัดหาสารหล่อลื่นประจำกับโรงงานในพื้นที่',
        ),
      },
      petrochemExport: {
        name: bilingual('Overseas Petrochemical Exporter', 'ผู้ส่งออกปิโตรเคมีต่างประเทศ'),
        flavor: bilingual(
          'Standing export agreement for refined petrochemical products.',
          'สัญญาส่งออกประจำสำหรับผลิตภัณฑ์ปิโตรเคมี',
        ),
      },
    },
  },
  contracts: {
    kicker: bilingual('Orders', 'คำสั่งซื้อ'),
    title: bilingual('Supply Contracts', 'สัญญาจัดส่ง'),
    fulfillButton: bilingual('Fulfill Order', 'ส่งมอบสัญญา'),
    needGasoline: (n: number) => bilingual(`Need ${n} more gasoline`, `ต้องการเบนซินอีก ${n} หน่วย`),
    needAsphalt: (n: number) => bilingual(`Need ${n} more asphalt`, `ต้องการแอสฟัลต์อีก ${n} หน่วย`),
    needJetFuel: (n: number) => bilingual(`Need ${n} more jet fuel`, `ต้องการเชื้อเพลิงอากาศยานอีก ${n} หน่วย`),
    needLubricants: (n: number) => bilingual(`Need ${n} more lubricants`, `ต้องการสารหล่อลื่นอีก ${n} หน่วย`),
    needPetrochemicals: (n: number) => bilingual(`Need ${n} more petrochemicals`, `ต้องการปิโตรเคมีอีก ${n} หน่วย`),
    // Structured contract card fields (replaces prose summary)
    productLabels: {
      gasoline: bilingual('Gasoline', 'เบนซิน'),
      asphalt: bilingual('Asphalt', 'แอสฟัลต์'),
      jetFuel: bilingual('Jet Fuel', 'เชื้อเพลิงอากาศยาน'),
      lubricants: bilingual('Lubricants', 'สารหล่อลื่น'),
      petrochemicals: bilingual('Petrochemicals', 'ปิโตรเคมี'),
    },
    requires: (amount: number, product: BilingualTextValue) =>
      bilingual(
        `Requires: ${amount} ${product.en}`,
        `ต้องการ: ${product.th} ${amount} หน่วย`,
      ),
    rewards: (money: number, rp: number, rep: number) =>
      bilingual(
        `Reward: $${money.toLocaleString()} · ${rp} RP · ${rep} rep`,
        `รางวัล: $${money.toLocaleString()} · ${rp} RP · ชื่อเสียง ${rep}`,
      ),
    asphaltSummary: (
      asphaltRequired: number,
      reward: number,
      rpReward: number,
      reputationReward: number,
    ) =>
      bilingual(
        `Deliver ${asphaltRequired} asphalt for $${reward.toLocaleString()}, ${rpReward} RP, and ${reputationReward} reputation.`,
        `ส่งมอบแอสฟัลต์ ${asphaltRequired} หน่วย เพื่อรับ $${reward.toLocaleString()}, ${rpReward} RP และชื่อเสียง ${reputationReward}`,
      ),
    completedButton: bilingual('Completed', 'สำเร็จแล้ว'),
    lockedButton: bilingual('Locked', 'ยังล็อกอยู่'),
    tierLabel: (tier: number) => bilingual(`Tier ${tier}`, `ระดับ ${tier}`),
    tierHeading: (tier: number) =>
      bilingual(`── Tier ${tier} Contracts`, `── สัญญาระดับ ${tier}`),
    unlockAtLevel: (level: number) =>
      bilingual(
        `Unlock at Refinery Level ${level}`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level}`,
      ),
    summary: (
      gasolineRequired: number,
      reward: number,
      rpReward: number,
      reputationReward: number,
    ) =>
      bilingual(
        `Deliver ${gasolineRequired} gasoline for $${reward.toLocaleString()}, ${rpReward} RP, and ${reputationReward} reputation.`,
        `ส่งมอบเบนซิน ${gasolineRequired} หน่วย เพื่อรับ $${reward.toLocaleString()}, ${rpReward} RP และชื่อเสียง ${reputationReward}`,
      ),
    reputationStatusTitle: bilingual('Reputation Status', 'สถานะชื่อเสียง'),
    currentTier: (name: BilingualTextValue) =>
      bilingual(`Current Tier: ${name.en}`, `ระดับปัจจุบัน: ${name.th}`),
    nextGoal: (reputation: number, name: BilingualTextValue) =>
      bilingual(
        `Next Goal: ${reputation} reputation for ${name.en}`,
        `เป้าหมายถัดไป: ชื่อเสียง ${reputation} เพื่อไปยัง ${name.th}`,
      ),
    topTierReached: bilingual(
      'Top reputation tier reached.',
      'ถึงระดับชื่อเสียงสูงสุดแล้ว',
    ),
  },
  reputation: {
    tiers: {
      starter: bilingual('Emerging Operator', 'ผู้ประกอบการกำลังเติบโต'),
      smallBonus: bilingual('Small Reputation Bonus', 'โบนัสชื่อเสียงขั้นต้น'),
      trustedSupplier: bilingual('Trusted Supplier', 'ผู้ส่งมอบที่น่าเชื่อถือ'),
      industryLeader: bilingual('Industry Leader', 'ผู้นำอุตสาหกรรม'),
    },
  },
  buildings: {
    kicker: bilingual('Building', 'อาคาร'),
    title: bilingual('Construction Menu', 'เมนูก่อสร้าง'),
    adjacencyNote: bilingual(
      'Adjacency only counts up, down, left, and right. Diagonals do not create combos.',
      'นับเฉพาะการวางติดกันด้านบน ล่าง ซ้าย ขวา เท่านั้น แนวทแยงไม่นับเป็นคอมโบ',
    ),
    gridKicker: bilingual('Refinery Grid', 'ผังโรงกลั่น'),
    gridTitle: bilingual('3x3 Layout', 'ผัง 3x3'),
    placeBuilding: (name: BilingualTextValue) =>
      bilingual(`Place ${name.en}`, `วาง ${name.th}`),
    gridAriaLabel: bilingual('Refinery building grid', 'ผังอาคารโรงกลั่น'),
    locked: bilingual('Locked', 'ถูกล็อก'),
    unlockAtLevel: (level: number) =>
      bilingual(
        `Unlock at Refinery Level ${level}`,
        `ปลดล็อกที่ระดับโรงกลั่น ${level}`,
      ),
    levelBadge: (level: number) => bilingual(`Lv${level}`, `Lv${level}`),
    maxLevelBadge: bilingual('Max', 'แม็กซ์'),
    upgradeButton: (cost: number) =>
      bilingual(`↑ $${cost.toLocaleString()}`, `↑ $${cost.toLocaleString()}`),
    removeModeButton: bilingual('Remove Building', 'ถอดอาคาร'),
    removeModeActive: bilingual('Remove Mode On', 'โหมดถอดเปิดอยู่'),
    noRefundWarning: bilingual('No refund', 'ไม่คืนเงิน'),
    removeCell: (name: BilingualTextValue) =>
      bilingual(`Remove ${name.en}`, `ถอด ${name.th}`),
  },
  activity: {
    kicker: bilingual('Activity', 'กิจกรรม'),
    title: bilingual('Operations Log', 'บันทึกการดำเนินงาน'),
  },
  data: {
    perks: {
      efficiency1: {
        name: bilingual('Streamlined Flow', 'การไหลที่ลื่นไหล'),
        description: bilingual('+10% production speed', '+10% ความเร็วการผลิต'),
      },
      efficiency2: {
        name: bilingual('Continuous Processing', 'การประมวลผลต่อเนื่อง'),
        description: bilingual('+15% production speed', '+15% ความเร็วการผลิต'),
      },
      efficiency3: {
        name: bilingual('Catalytic Mastery', 'เชี่ยวชาญตัวเร่งปฏิกิริยา'),
        description: bilingual('+25% production speed', '+25% ความเร็วการผลิต'),
      },
      capacity1: {
        name: bilingual('Expanded Tankage', 'ขยายถังเก็บ'),
        description: bilingual('+10% storage capacity', '+10% ความจุการเก็บ'),
      },
      capacity2: {
        name: bilingual('Smart Logistics', 'โลจิสติกส์อัจฉริยะ'),
        description: bilingual('+15% storage, 5% cheaper crude', '+15% การเก็บ น้ำมันดิบถูกลง 5%'),
      },
      capacity3: {
        name: bilingual('Strategic Reserves', 'คลังสำรองเชิงกลยุทธ์'),
        description: bilingual('+25% storage, 10% cheaper crude', '+25% การเก็บ น้ำมันดิบถูกลง 10%'),
      },
      quality1: {
        name: bilingual('Refined Output', 'ผลผลิตคุณภาพ'),
        description: bilingual('+5% sell price', '+5% ราคาขาย'),
      },
      quality2: {
        name: bilingual('Premium Grade', 'เกรดพรีเมียม'),
        description: bilingual('+10% sell price', '+10% ราคาขาย'),
      },
      quality3: {
        name: bilingual('Certified Excellence', 'รับรองความเป็นเลิศ'),
        description: bilingual('+20% sell price', '+20% ราคาขาย'),
      },
    },
    eras: {
      foundation: {
        name: bilingual('Foundation Era', 'ยุคก่อตั้ง'),
        tagline: bilingual('A small refinery finds its footing.', 'โรงกลั่นเล็กๆ เริ่มตั้งหลัก'),
      },
      expansion: {
        name: bilingual('Expansion Era', 'ยุคขยายตัว'),
        tagline: bilingual('Growth unlocks better markets. +10% sell price, +15% RP.', 'การเติบโตเปิดตลาดที่ดีขึ้น +10% ราคาขาย, +15% RP'),
      },
      modern: {
        name: bilingual('Modern Era', 'ยุคสมัยใหม่'),
        tagline: bilingual('A world-class operation. +20% sell price, +30% RP.', 'การดำเนินงานระดับโลก +20% ราคาขาย, +30% RP'),
      },
    },
    buildings: {
      crudeTank: {
        name: bilingual('Crude Tank', 'ถังน้ำมันดิบ'),
        role: bilingual('Storage Specialist', 'ผู้เชี่ยวชาญด้านการเก็บ'),
        description: bilingual(
          '+25 crude capacity. Stack multiples to buy in bulk and keep production fed.',
          '+25 ความจุน้ำมันดิบ สร้างหลายถังเพื่อซื้อจำนวนมากและป้อนการผลิตต่อเนื่อง',
        ),
      },
      distillationUnit: {
        name: bilingual('Distillation Unit', 'หน่วยกลั่น'),
        role: bilingual('Production Specialist', 'ผู้เชี่ยวชาญด้านการผลิต'),
        description: bilingual(
          '-120ms per cycle. Stack units to approach the minimum production limit.',
          '-120ms ต่อรอบ สร้างหลายหน่วยเพื่อเข้าใกล้ขีดจำกัดการผลิตขั้นต่ำ',
        ),
      },
      productTank: {
        name: bilingual('Product Tank', 'ถังเก็บผลิตภัณฑ์'),
        role: bilingual('Distribution Specialist', 'ผู้เชี่ยวชาญด้านการจัดจำหน่าย'),
        description: bilingual(
          '+25 gasoline capacity. Larger inventory lets you fulfil bigger contracts.',
          '+25 ความจุเบนซิน คลังขนาดใหญ่ช่วยให้รับสัญญาขนาดใหญ่ได้',
        ),
      },
      laboratory: {
        name: bilingual('Laboratory', 'ห้องปฏิบัติการ'),
        role: bilingual('Technology Specialist', 'ผู้เชี่ยวชาญด้านเทคโนโลยี'),
        description: bilingual(
          '+10% RP from contracts. Upgrade for stronger research acceleration.',
          '+10% RP จากสัญญา อัปเกรดเพื่อเร่งการวิจัยให้แรงขึ้น',
        ),
      },
      maintenanceWorkshop: {
        name: bilingual('Maintenance Workshop', 'โรงซ่อมบำรุง'),
        role: bilingual('Reliability Specialist', 'ผู้เชี่ยวชาญด้านความน่าเชื่อถือ'),
        description: bilingual(
          'Absorbs operational shocks. Reduces negative event penalties by 50%.',
          'รองรับแรงกระทบจากเหตุการณ์ ลดผลเสียจากเหตุการณ์เชิงลบลง 50%',
        ),
      },
      salesOffice: {
        name: bilingual('Sales Office', 'สำนักงานขาย'),
        role: bilingual('Commercial Specialist', 'ผู้เชี่ยวชาญด้านการพาณิชย์'),
        description: bilingual(
          '+10% contract rewards. Closes deals at better rates across all tiers.',
          '+10% รางวัลจากสัญญา ปิดดีลได้ดีขึ้นในทุกระดับสัญญา',
        ),
      },
      lubricantPlant: {
        name: bilingual('Lubricant Plant', 'โรงผลิตสารหล่อลื่น'),
        role: bilingual('Secondary Production', 'การผลิตรอง'),
        description: bilingual(
          'Converts crude into lubricants. 10 crude → 5 lubricants every 5s per plant.',
          'แปลงน้ำมันดิบเป็นสารหล่อลื่น 10 น้ำมันดิบ → 5 สารหล่อลื่น ทุก 5 วินาทีต่อโรงงาน',
        ),
      },
      jetFuelPlant: {
        name: bilingual('Jet Fuel Plant', 'โรงผลิตเชื้อเพลิงอากาศยาน'),
        role: bilingual('Premium Production', 'การผลิตพรีเมียม'),
        description: bilingual(
          'Converts crude into jet fuel. 20 crude → 5 jet fuel every 5s per plant.',
          'แปลงน้ำมันดิบเป็นเชื้อเพลิงอากาศยาน 20 น้ำมันดิบ → 5 เชื้อเพลิง ทุก 5 วินาทีต่อโรงงาน',
        ),
      },
      petrochemicalPlant: {
        name: bilingual('Petrochemical Plant', 'โรงผลิตปิโตรเคมี'),
        role: bilingual('Apex Production', 'การผลิตสูงสุด'),
        description: bilingual(
          'Converts crude into petrochemicals. 30 crude → 5 petrochemicals every 5s per plant.',
          'แปลงน้ำมันดิบเป็นปิโตรเคมี 30 น้ำมันดิบ → 5 ปิโตรเคมี ทุก 5 วินาทีต่อโรงงาน',
        ),
      },
    } satisfies Record<
      BuildingType,
      { name: BilingualTextValue; description: BilingualTextValue; role: BilingualTextValue }
    >,
    workers: {
      operator: {
        name: bilingual('Operator', 'โอเปอเรเตอร์'),
        description: bilingual('+10% production rate', '+10% อัตราการผลิต'),
      },
      mechanic: {
        name: bilingual('Mechanic', 'ช่างเทคนิค'),
        description: bilingual(
          '+25 max crude and +25 max gasoline',
          '+25 ความจุน้ำมันดิบ และ +25 ความจุเบนซิน',
        ),
      },
      salesAgent: {
        name: bilingual('Sales Agent', 'เจ้าหน้าที่ฝ่ายขาย'),
        description: bilingual('+3 gasoline sell price', '+3 ราคาขายเบนซิน'),
      },
      safetyOfficer: {
        name: bilingual('Safety Officer', 'เจ้าหน้าที่ความปลอดภัย'),
        description: bilingual('-15% event penalties per officer', '-15% ผลเสียจากเหตุการณ์ต่อคน'),
      },
      chemist: {
        name: bilingual('Chemist', 'นักเคมี'),
        description: bilingual('+10% RP earned from contracts', '+10% RP ที่ได้รับจากสัญญา'),
      },
      logisticsCoordinator: {
        name: bilingual('Logistics Coordinator', 'ผู้ประสานงานโลจิสติกส์'),
        description: bilingual('+10% shipment crude received', '+10% น้ำมันดิบที่รับจากการขนส่ง'),
      },
      fuelSpecialist: {
        name: bilingual('Fuel Specialist', 'ผู้เชี่ยวชาญเชื้อเพลิง'),
        description: bilingual('+5% gasoline sell price per worker', '+5% ราคาขายน้ำมันเบนซินต่อคนงาน'),
      },
      aviationSpecialist: {
        name: bilingual('Aviation Specialist', 'ผู้เชี่ยวชาญการบิน'),
        description: bilingual('+20% jet fuel production per worker', '+20% การผลิตเชื้อเพลิงอากาศยานต่อคนงาน'),
      },
      chemicalEngineer: {
        name: bilingual('Chemical Engineer', 'วิศวกรเคมี'),
        description: bilingual('+20% petrochemical production per worker', '+20% การผลิตปิโตรเคมีต่อคนงาน'),
      },
    } satisfies Record<
      WorkerType,
      { name: BilingualTextValue; description: BilingualTextValue }
    >,
    researchItems: {
      betterPumps: {
        name: bilingual('Better Pumps', 'ปั๊มที่ดีขึ้น'),
        description: bilingual('+10% production rate', '+10% อัตราการผลิต'),
      },
      biggerTanks: {
        name: bilingual('Bigger Tanks', 'ถังขนาดใหญ่ขึ้น'),
        description: bilingual(
          '+50 max crude and +50 max gasoline',
          '+50 ความจุน้ำมันดิบ และ +50 ความจุเบนซิน',
        ),
      },
      premiumFuel: {
        name: bilingual('Premium Fuel', 'เชื้อเพลิงพรีเมียม'),
        description: bilingual('+5 gasoline sell price', '+5 ราคาขายเบนซิน'),
      },
      advancedDistillation: {
        name: bilingual('Advanced Distillation', 'การกลั่นขั้นสูง'),
        description: bilingual('+25% production rate', '+25% อัตราการผลิต'),
      },
      industrialStorage: {
        name: bilingual('Industrial Storage', 'คลังอุตสาหกรรม'),
        description: bilingual(
          '+150 crude storage and +150 gasoline storage',
          '+150 ความจุน้ำมันดิบ และ +150 ความจุเบนซิน',
        ),
      },
      premiumContracts: {
        name: bilingual('Premium Contracts', 'สัญญาพรีเมียม'),
        description: bilingual('+20% contract rewards', '+20% รางวัลจากสัญญา'),
      },
      advancedProcessing: {
        name: bilingual('Advanced Processing', 'การประมวลผลขั้นสูง'),
        description: bilingual('+10% additional production rate', '+10% อัตราการผลิตเพิ่มเติม'),
      },
      storageOptimization: {
        name: bilingual('Storage Optimization', 'การปรับคลังให้เหมาะสม'),
        description: bilingual('+75 max crude and +75 max gasoline', '+75 ความจุน้ำมันดิบ และ +75 ความจุเบนซิน'),
      },
      contractAnalytics: {
        name: bilingual('Contract Analytics', 'การวิเคราะห์สัญญา'),
        description: bilingual('+15% RP from contracts', '+15% RP จากสัญญา'),
      },
      saferOperations: {
        name: bilingual('Safer Operations', 'การดำเนินงานที่ปลอดภัยขึ้น'),
        description: bilingual('Event penalties reduced by 15%', 'ลดผลเสียจากเหตุการณ์ 15%'),
      },
    } satisfies Record<
      ResearchKey,
      { name: BilingualTextValue; description: BilingualTextValue }
    >,
    contracts: {
      1: {
        name: bilingual('Local Gas Station', 'ปั๊มน้ำมันท้องถิ่น'),
      },
      2: {
        name: bilingual('City Bus Depot', 'อู่รถโดยสารประจำเมือง'),
      },
      3: {
        name: bilingual('Airport Trial Supply', 'โครงการส่งเชื้อเพลิงทดลองสนามบิน'),
      },
      4: {
        name: bilingual('Regional Fuel Distributor', 'ผู้กระจายเชื้อเพลิงระดับภูมิภาค'),
      },
      5: {
        name: bilingual(
          'Industrial Manufacturing Plant',
          'โรงงานอุตสาหกรรมการผลิต',
        ),
      },
      6: {
        name: bilingual('International Airport', 'สนามบินนานาชาติ'),
      },
      7: {
        name: bilingual('Petrochemical Complex', 'ศูนย์ปิโตรเคมีครบวงจร'),
      },
      8: {
        name: bilingual('Neighborhood Fuel Stop', 'ปั๊มน้ำมันในละแวกบ้าน'),
      },
      9: {
        name: bilingual('Small Factory Supply', 'โรงงานขนาดเล็ก'),
      },
      10: {
        name: bilingual('Emergency Fuel Request', 'คำสั่งซื้อฉุกเฉิน'),
      },
      11: {
        name: bilingual('Regional Distributor Deal', 'ดีลผู้จัดจำหน่ายระดับภูมิภาค'),
      },
      12: {
        name: bilingual('Government Reserve Order', 'คำสั่งซื้อสำรองราชการ'),
      },
      13: {
        name: bilingual('Industrial Client Contract', 'สัญญาลูกค้าอุตสาหกรรม'),
      },
      14: {
        name: bilingual('Export Trial Shipment', 'การส่งออกทดลอง'),
      },
      15: {
        name: bilingual('High Reputation Partner', 'พันธมิตรชื่อเสียงสูง'),
      },
      16: {
        name: bilingual('National Energy Supply', 'สัญญาพลังงานแห่งชาติ'),
      },
      // Asphalt contracts
      17: {
        name: bilingual('Road Repair Supplier', 'ผู้จัดหาวัสดุซ่อมถนน'),
      },
      18: {
        name: bilingual('Airport Runway Project', 'โครงการลาดยางสนามบิน'),
      },
      // Jet Fuel contracts
      19: {
        name: bilingual('Charter Airline Supply', 'สัญญาเชื้อเพลิงสายการบินเช่าเหมาลำ'),
      },
      20: {
        name: bilingual('Regional Airport Reserve', 'สำรองเชื้อเพลิงสนามบินภูมิภาค'),
      },
      // Lubricant contracts
      21: {
        name: bilingual('Auto Repair Chain', 'เครือข่ายศูนย์ซ่อมรถยนต์'),
      },
      22: {
        name: bilingual('Heavy Machinery Supplier', 'ผู้จัดหาเครื่องจักรกลหนัก'),
      },
      23: {
        name: bilingual('Industrial Maintenance Group', 'กลุ่มบำรุงรักษาอุตสาหกรรม'),
      },
      // Petrochemical contracts
      24: {
        name: bilingual('Plastic Manufacturer', 'ผู้ผลิตพลาสติก'),
      },
      25: {
        name: bilingual('Chemical Processing Group', 'กลุ่มแปรรูปสารเคมี'),
      },
      26: {
        name: bilingual('Industrial Materials Consortium', 'สมาคมวัสดุอุตสาหกรรม'),
      },
    } satisfies Record<number, { name: BilingualTextValue }>,
    milestones: {
      firstFuel: {
        name: bilingual('First Fuel', 'เชื้อเพลิงชุดแรก'),
        requirement: bilingual(
          'Produce 50 total gasoline',
          'ผลิตเบนซินรวมให้ครบ 50 หน่วย',
        ),
        reward: '$300',
      },
      smallSupplier: {
        name: bilingual('Small Supplier', 'ผู้ส่งมอบรายย่อย'),
        requirement: bilingual(
          'Complete 2 contracts',
          'ทำสัญญาให้สำเร็จ 2 ฉบับ',
        ),
        reward: '5 RP',
      },
      growingRefinery: {
        name: bilingual('Growing Refinery', 'โรงกลั่นที่กำลังเติบโต'),
        requirement: bilingual(
          'Hire 3 total workers',
          'จ้างพนักงานรวม 3 คน',
        ),
        reward: '$1000',
      },
      researchBeginner: {
        name: bilingual('Research Beginner', 'เริ่มต้นสายวิจัย'),
        requirement: bilingual(
          'Unlock 1 research item',
          'ปลดล็อกงานวิจัย 1 รายการ',
        ),
        reward: '$500, +20 Rep',
      },
      upgradeBuilder: {
        name: bilingual('First Upgrade', 'การอัปเกรดครั้งแรก'),
        requirement: bilingual(
          'Upgrade any building to Level 2',
          'อัปเกรดอาคารใดก็ได้เป็นระดับ 2',
        ),
        reward: '$500, 5 RP',
      },
      reputedSupplier: {
        name: bilingual('Trusted Name', 'ชื่อเสียงที่น่าเชื่อถือ'),
        requirement: bilingual(
          'Reach 50 reputation',
          'สะสมชื่อเสียงให้ครบ 50',
        ),
        reward: '$800, 10 RP',
      },
      industrialProducer: {
        name: bilingual('Industrial Producer', 'ผู้ผลิตระดับอุตสาหกรรม'),
        requirement: bilingual(
          'Produce 500 total gasoline',
          'ผลิตเบนซินรวมให้ครบ 500 หน่วย',
        ),
        reward: '$1,200',
      },
      refineryLevel5: {
        name: bilingual('Mid-Scale Operations', 'การดำเนินงานระดับกลาง'),
        requirement: bilingual(
          'Reach Refinery Level 5',
          'พัฒนาโรงกลั่นถึงระดับ 5',
        ),
        reward: '$1,500, +20 Rep',
      },
      researchAdvanced: {
        name: bilingual('Research Pioneer', 'ผู้บุกเบิกการวิจัย'),
        requirement: bilingual(
          'Unlock 3 research items',
          'ปลดล็อกงานวิจัย 3 รายการ',
        ),
        reward: '$1,000, +15 Rep',
      },
      contractVeteran: {
        name: bilingual('Contract Veteran', 'ทหารผ่านศึกสัญญา'),
        requirement: bilingual(
          'Complete 10 contracts',
          'ทำสัญญาให้สำเร็จ 10 ฉบับ',
        ),
        reward: '$2,000, 15 RP',
      },
      tierThreeContractor: {
        name: bilingual('Premium Contractor', 'ผู้รับสัญญาระดับพรีเมียม'),
        requirement: bilingual(
          'Complete a Tier 3 contract',
          'ทำสัญญาระดับ 3 ให้สำเร็จ',
        ),
        reward: '$3,000, +40 Rep',
      },
      fullWorkforce: {
        name: bilingual('Full Crew', 'ทีมงานครบชุด'),
        requirement: bilingual(
          'Hire at least one of every worker type',
          'จ้างพนักงานทุกประเภทอย่างน้อย 1 คน',
        ),
        reward: '$3,000, +35 Rep',
      },
      jetFuelPioneer: {
        name: bilingual('Jet Fuel Pioneer', 'ผู้บุกเบิกเชื้อเพลิงอากาศยาน'),
        requirement: bilingual(
          'Build a Jet Fuel Plant',
          'สร้างโรงงานเชื้อเพลิงอากาศยาน',
        ),
        reward: '$2,500, +25 Rep',
      },
      aviationPartner: {
        name: bilingual('Aviation Partner', 'พันธมิตรการบิน'),
        requirement: bilingual(
          'Complete a jet fuel contract',
          'ทำสัญญาเชื้อเพลิงอากาศยานสำเร็จ 1 ฉบับ',
        ),
        reward: '$4,000, 30 RP',
      },
      petrochemicalPioneer: {
        name: bilingual('Petrochemical Pioneer', 'ผู้บุกเบิกปิโตรเคมี'),
        requirement: bilingual(
          'Build a Petrochemical Plant',
          'สร้างโรงงานปิโตรเคมี',
        ),
        reward: '$5,000, +50 Rep',
      },
      productMogul: {
        name: bilingual('Product Mogul', 'เจ้าพ่อผลิตภัณฑ์'),
        requirement: bilingual(
          'Complete a contract for every product line',
          'ทำสัญญาสำเร็จครบทุกสายผลิตภัณฑ์',
        ),
        reward: '$10,000, +75 Rep',
      },
    } satisfies Record<
      MilestoneKey,
      { name: BilingualTextValue; requirement: BilingualTextValue; reward: string }
    >,
    events: {
      crudeDiscount: {
        name: bilingual('Crude Discount', 'ส่วนลดน้ำมันดิบ'),
        message: bilingual(
          'Supplier offered discounted crude. Crude +10.',
          'ซัพพลายเออร์เสนอส่วนลดน้ำมันดิบ น้ำมันดิบ +10',
        ),
      },
      machineTuneUp: {
        name: bilingual('Machine Tune-up', 'ปรับแต่งเครื่องจักร'),
        message: bilingual(
          'Maintenance team improved efficiency. Money +$200.',
          'ทีมซ่อมบำรุงช่วยเพิ่มประสิทธิภาพ เงิน +$200',
        ),
      },
      minorLeak: {
        name: bilingual('Minor Leak', 'การรั่วเล็กน้อย'),
        message: bilingual(
          'Minor leak detected. Crude -20.',
          'ตรวจพบการรั่วเล็กน้อย น้ำมันดิบ -20',
        ),
      },
      qualityBonus: {
        name: bilingual('Quality Bonus', 'โบนัสคุณภาพ'),
        message: bilingual(
          'Quality batch completed. Gasoline +20.',
          'ได้ล็อตคุณภาพสูง เบนซิน +20',
        ),
      },
      marketDemandSpike: {
        name: bilingual('Market Demand Spike', 'ความต้องการตลาดพุ่งสูง'),
        message: bilingual(
          'Market demand increased. Money +$750.',
          'ความต้องการในตลาดเพิ่มขึ้น เงิน +$750',
        ),
      },
      safetyInspection: {
        name: bilingual('Safety Inspection', 'การตรวจความปลอดภัย'),
        message: bilingual(
          'Safety inspection passed. Reputation +10.',
          'ผ่านการตรวจความปลอดภัย ชื่อเสียง +10',
        ),
      },
      equipmentWear: {
        name: bilingual('Equipment Wear', 'การสึกหรอของอุปกรณ์'),
        message: bilingual(
          'Equipment wear reduced output. Gasoline -10.',
          'อุปกรณ์สึกหรอทำให้ผลผลิตลดลง เบนซิน -10',
        ),
      },
      efficientBatch: {
        name: bilingual('Efficient Batch', 'ล็อตประสิทธิภาพสูง'),
        message: bilingual(
          'Efficient production run. Gasoline +30.',
          'กระบวนการผลิตมีประสิทธิภาพสูง เบนซิน +30',
        ),
      },
      localNewsCoverage: {
        name: bilingual('Local News Coverage', 'สื่อท้องถิ่นรายงานข่าว'),
        message: bilingual(
          'Local news featured your refinery positively. Reputation +15.',
          'สื่อท้องถิ่นรายงานข่าวโรงกลั่นของคุณในแง่บวก ชื่อเสียง +15',
        ),
      },
      supplierDiscount: {
        name: bilingual('Supplier Discount', 'ส่วนลดจากซัพพลายเออร์'),
        message: bilingual(
          'Supplier sent a bonus crude shipment. Crude +15.',
          'ซัพพลายเออร์ส่งน้ำมันดิบโบนัสมาให้ น้ำมันดิบ +15',
        ),
      },
      equipmentInspection: {
        name: bilingual('Equipment Inspection', 'การตรวจสอบอุปกรณ์'),
        message: bilingual(
          'Scheduled inspection passed. Money −$150, Reputation +10.',
          'ผ่านการตรวจสอบตามกำหนด เงิน −$150, ชื่อเสียง +10',
        ),
      },
      workerSuggestion: {
        name: bilingual('Worker Suggestion', 'ข้อเสนอแนะจากพนักงาน'),
        message: bilingual(
          'A worker submitted a process improvement idea. Research Points +3.',
          'พนักงานเสนอแนวทางปรับปรุงกระบวนการผลิต คะแนนวิจัย +3',
        ),
      },
      storageContamination: {
        name: bilingual('Storage Contamination', 'การปนเปื้อนในถังเก็บ'),
        message: bilingual(
          'Contamination detected in a storage tank. Gasoline −15.',
          'ตรวจพบการปนเปื้อนในถังเก็บผลิตภัณฑ์ เบนซิน −15',
        ),
      },
      communityVisit: {
        name: bilingual('Community Visit', 'กิจกรรมชุมชน'),
        message: bilingual(
          'Community open day hosted. Money −$200, Reputation +20.',
          'จัดวันเปิดบ้านให้ชุมชน เงิน −$200, ชื่อเสียง +20',
        ),
      },
    } satisfies Record<
      RandomEventKey,
      { name: BilingualTextValue; message: BilingualTextValue }
    >,
    safetyInspectionFailMessage: bilingual(
      'Safety inspection failed. Money -$300.',
      'ไม่ผ่านการตรวจความปลอดภัย เงิน -$300',
    ),
  },
  choiceEvents: {
    kicker: bilingual('Decision', 'การตัดสินใจ'),
    chooseLabel: bilingual('Choose an option:', 'เลือกตัวเลือก:'),
    logChose: (title: BilingualTextValue, option: BilingualTextValue) =>
      bilingual(
        `Resolved "${title.en}": chose ${option.en}.`,
        `ตัดสินใจ "${title.th}": เลือก ${option.th}`,
      ),
    events: {
      supplierNegotiation: {
        title: bilingual('Supplier Negotiation', 'การเจรจากับซัพพลายเออร์'),
        description: bilingual(
          'A supplier offers a bulk crude deal. Choose how to respond.',
          'ซัพพลายเออร์เสนอดีลน้ำมันดิบจำนวนมาก เลือกวิธีตอบสนอง',
        ),
        optionA: bilingual(
          'Accept bulk deal (+100 crude, −5 reputation)',
          'รับดีลจำนวนมาก (+100 น้ำมันดิบ, −5 ชื่อเสียง)',
        ),
        optionB: bilingual(
          'Decline ethically (+10 reputation, −$500)',
          'ปฏิเสธอย่างมีจริยธรรม (+10 ชื่อเสียง, −$500)',
        ),
      },
      researchGrant: {
        title: bilingual('Research Grant', 'ทุนวิจัย'),
        description: bilingual(
          'A government grant arrives. Choose how to allocate the funds.',
          'ทุนจากภาครัฐมาถึง เลือกวิธีจัดสรรเงินทุน',
        ),
        optionA: bilingual('Invest in research (+20 RP)', 'ลงทุนด้านวิจัย (+20 RP)'),
        optionB: bilingual('Take the cash (+$1000)', 'รับเป็นเงินสด (+$1000)'),
      },
      workerRecruitment: {
        title: bilingual('Worker Recruitment', 'การรับสมัครพนักงาน'),
        description: bilingual(
          'Two candidates are available. Choose who to hire.',
          'มีผู้สมัครสองคน เลือกว่าจะจ้างใคร',
        ),
        optionA: bilingual('Hire Operator (+1 Operator)', 'จ้างโอเปอเรเตอร์ (+1 คน)'),
        optionB: bilingual('Hire Mechanic (+1 Mechanic)', 'จ้างช่างเทคนิค (+1 คน)'),
      },
      equipmentEmergency: {
        title: bilingual('Equipment Emergency', 'ฉุกเฉินด้านอุปกรณ์'),
        description: bilingual(
          'A critical pump has failed. Immediate action required.',
          'ปั๊มหลักเกิดขัดข้อง ต้องดำเนินการทันที',
        ),
        optionA: bilingual(
          'Call emergency service (−$600, +20 gasoline recovered)',
          'เรียกช่างฉุกเฉิน (−$600, +20 เบนซินที่กู้คืนได้)',
        ),
        optionB: bilingual(
          'Defer repair (−20 crude lost to contamination)',
          'เลื่อนการซ่อม (−20 น้ำมันดิบปนเปื้อน)',
        ),
      },
      governmentIncentive: {
        title: bilingual('Government Incentive', 'แรงจูงใจจากภาครัฐ'),
        description: bilingual(
          'A government energy program offers your refinery a benefit.',
          'โปรแกรมพลังงานภาครัฐเสนอผลประโยชน์ให้โรงกลั่นของคุณ',
        ),
        optionA: bilingual(
          'Accept cash grant (+$1500, −10 reputation)',
          'รับเงินอุดหนุน (+$1500, −10 ชื่อเสียง)',
        ),
        optionB: bilingual(
          'Accept industry award (+25 reputation, +5 RP)',
          'รับรางวัลอุตสาหกรรม (+25 ชื่อเสียง, +5 RP)',
        ),
      },
      qualityAlert: {
        title: bilingual('Quality Alert', 'การแจ้งเตือนคุณภาพ'),
        description: bilingual(
          'Quality control has flagged a suspect batch of gasoline.',
          'ฝ่ายควบคุมคุณภาพตรวจพบล็อตเบนซินที่น่าสงสัย',
        ),
        optionA: bilingual(
          'Replace the batch (−20 gasoline, +15 reputation)',
          'เปลี่ยนล็อตใหม่ (−20 เบนซิน, +15 ชื่อเสียง)',
        ),
        optionB: bilingual(
          'Ship as-is (−10 reputation, keep gasoline)',
          'ส่งตามเดิม (−10 ชื่อเสียง, คงเบนซินไว้)',
        ),
      },
      supplyChainDelay: {
        title: bilingual('Supply Chain Delay', 'ความล่าช้าของห่วงโซ่อุปทาน'),
        description: bilingual(
          'An upstream supplier reports a crude delivery delay.',
          'ซัพพลายเออร์ต้นน้ำรายงานความล่าช้าในการส่งน้ำมันดิบ',
        ),
        optionA: bilingual(
          'Pay express fee (−$400, +30 crude delivered now)',
          'จ่ายค่าด่วน (−$400, +30 น้ำมันดิบส่งทันที)',
        ),
        optionB: bilingual(
          'Manage with reserves (+5 reputation for preparedness)',
          'บริหารด้วยสต็อกที่มี (+5 ชื่อเสียงจากความพร้อม)',
        ),
      },
      investorVisit: {
        title: bilingual('Investor Visit', 'นักลงทุนมาเยือน'),
        description: bilingual(
          'A potential investor wants a tour of your refinery.',
          'นักลงทุนที่มีแนวโน้มต้องการเยี่ยมชมโรงกลั่นของคุณ',
        ),
        optionA: bilingual(
          'Host tour (−$300, +20 reputation)',
          'จัดทัวร์เยี่ยมชม (−$300, +20 ชื่อเสียง)',
        ),
        optionB: bilingual(
          'Politely decline (−5 reputation)',
          'ปฏิเสธอย่างสุภาพ (−5 ชื่อเสียง)',
        ),
      },
      oldEquipmentSale: {
        title: bilingual('Old Equipment Sale', 'ขายอุปกรณ์เก่า'),
        description: bilingual(
          'You have a stockpile of old parts. What will you do with them?',
          'คุณมีอุปกรณ์เก่าสะสมอยู่ จะจัดการอย่างไร?',
        ),
        optionA: bilingual(
          'Sell for scrap (+$800)',
          'ขายเป็นเศษเหล็ก (+$800)',
        ),
        optionB: bilingual(
          'Repurpose as crude reserves (+15 crude)',
          'นำไปใช้เป็นสำรองน้ำมันดิบ (+15 น้ำมันดิบ)',
        ),
      },
      trainingRequest: {
        title: bilingual('Training Request', 'คำขอฝึกอบรม'),
        description: bilingual(
          'A staff member requests budget for an external training course.',
          'พนักงานขอเงินสนับสนุนการฝึกอบรมภายนอก',
        ),
        optionA: bilingual(
          'Fund the training (−$500, +8 RP)',
          'สนับสนุนการฝึกอบรม (−$500, +8 RP)',
        ),
        optionB: bilingual(
          'Skip this time (no change)',
          'ข้ามครั้งนี้ (ไม่มีการเปลี่ยนแปลง)',
        ),
      },
      communityComplaint: {
        title: bilingual('Community Complaint', 'ข้อร้องเรียนจากชุมชน'),
        description: bilingual(
          'Residents near the refinery have filed a noise complaint.',
          'ผู้อยู่อาศัยใกล้โรงกลั่นยื่นข้อร้องเรียนเรื่องเสียงรบกวน',
        ),
        optionA: bilingual(
          'Address the complaint (−$350, +15 reputation)',
          'แก้ไขปัญหา (−$350, +15 ชื่อเสียง)',
        ),
        optionB: bilingual(
          'Ignore it (−12 reputation)',
          'เพิกเฉย (−12 ชื่อเสียง)',
        ),
      },
      rushOrder: {
        title: bilingual('Rush Order', 'คำสั่งซื้อด่วน'),
        description: bilingual(
          'A client needs an emergency fuel delivery by end of day.',
          'ลูกค้าต้องการส่งมอบเชื้อเพลิงฉุกเฉินภายในวันนี้',
        ),
        optionA: bilingual(
          'Accept rush order (−30 gasoline, +$800)',
          'รับคำสั่งด่วน (−30 เบนซิน, +$800)',
        ),
        optionB: bilingual(
          'Decline politely (+5 reputation for reliability)',
          'ปฏิเสธอย่างสุภาพ (+5 ชื่อเสียงจากความน่าเชื่อถือ)',
        ),
      },
    } satisfies Record<
      ChoiceEventKey,
      {
        title: BilingualTextValue
        description: BilingualTextValue
        optionA: BilingualTextValue
        optionB: BilingualTextValue
      }
    >,
  },
  starterGuide: {
    title: bilingual('Getting Started', 'เริ่มต้นใช้งาน'),
    step1: bilingual('Refine crude oil into gasoline', 'กลั่นน้ำมันดิบเป็นเบนซิน'),
    step2: bilingual('Buy more crude oil to keep refining', 'ซื้อน้ำมันดิบเพิ่มเพื่อกลั่นต่อ'),
    step3: bilingual('Complete your first contract', 'ทำสัญญาแรกให้สำเร็จ'),
    dismissButton: bilingual('Dismiss', 'ปิด'),
    hint: bilingual(
      'Tip: Build a Product Tank to store gasoline · Build a Crude Tank for more crude capacity',
      'เคล็ดลับ: สร้าง Product Tank เพื่อเก็บเบนซิน · สร้าง Crude Tank เพื่อเพิ่มความจุน้ำมันดิบ',
    ),
    allDone: bilingual("You know the basics — good luck!", 'คุณรู้พื้นฐานแล้ว — โชคดี!'),
  },
  goal: {
    kicker: bilingual('Prototype', 'ต้นแบบ'),
    title: bilingual('Prototype Goal', 'เป้าหมายต้นแบบ'),
    refineryLevelItem: (current: number, target: number) =>
      bilingual(
        `Reach Refinery Level ${target}: ${current}/${target}`,
        `ถึงระดับโรงกลั่น ${target}: ${current}/${target}`,
      ),
    reputationItem: (current: number, target: number) =>
      bilingual(
        `Reach Reputation ${target}: ${current}/${target}`,
        `ถึงชื่อเสียง ${target}: ${current}/${target}`,
      ),
    contractItem: bilingual(
      'Complete Petrochemical Complex',
      'ทำสัญญา Petrochemical Complex ให้สำเร็จ',
    ),
    expansionItem: bilingual('Expand refinery to 5×5', 'ขยายโรงกลั่นเป็น 5×5'),
    done: bilingual('Completed', 'สำเร็จแล้ว'),
    notDone: bilingual('Not completed', 'ยังไม่สำเร็จ'),
    allDone: bilingual(
      'Prototype Complete! Your refinery is ready for the next phase.',
      'ต้นแบบสมบูรณ์! โรงกลั่นของคุณพร้อมสำหรับขั้นตอนต่อไปแล้ว',
    ),
    completionLog: bilingual(
      'Prototype Complete! All goals achieved.',
      'ต้นแบบสมบูรณ์! บรรลุเป้าหมายทั้งหมดแล้ว',
    ),
  },
  shipments: {
    kicker: bilingual('Supply', 'การจัดหา'),
    title: bilingual('Crude Shipments', 'การสั่งซื้อน้ำมันดิบ'),
    names: {
      miniDelivery: bilingual('Mini Delivery', 'ส่งขนาดเล็ก'),
      localTruck: bilingual('Local Truck Delivery', 'รถบรรทุกท้องถิ่น'),
      coastalTanker: bilingual('Coastal Tanker', 'เรือบรรทุกชายฝั่ง'),
      importedShip: bilingual('Imported Crude Ship', 'เรือนำเข้าน้ำมันดิบ'),
      tankerConvoy: bilingual('Tanker Convoy', 'กองเรือบรรทุก'),
    },
    amount: (n: number) => bilingual(`${n} crude`, `น้ำมันดิบ ${n} หน่วย`),
    cost: (n: number) =>
      bilingual(`$${n.toLocaleString()}`, `$${n.toLocaleString()}`),
    delaySecs: (s: number) => {
      if (s >= 60) {
        const m = Math.round(s / 60)
        return bilingual(`${m}m delivery`, `ส่งใน ${m} นาที`)
      }
      return bilingual(`${s}s delivery`, `ส่งใน ${s} วินาที`)
    },
    costPerUnit: (n: number) =>
      bilingual(`$${n.toFixed(1)}/crude`, `$${n.toFixed(1)}/หน่วย`),
    effectiveAmount: (base: number, bonus: number) =>
      bilingual(
        `+${bonus} logistics bonus → ${base + bonus} crude`,
        `+${bonus} โบนัสโลจิสติกส์ → ${base + bonus} หน่วย`,
      ),
    lowCapacityWarning: bilingual(
      'Low tank space — some crude may be discarded.',
      'พื้นที่ถังเหลือน้อย — น้ำมันดิบบางส่วนอาจถูกทิ้ง',
    ),
    orderButton: bilingual('Order', 'สั่งซื้อ'),
    orderCantAfford: bilingual("Can't Afford", 'ไม่มีเงินพอ'),
    pendingTitle: bilingual('In Transit', 'ระหว่างการขนส่ง'),
    countdown: (s: number) => {
      if (s >= 60) {
        const m = Math.floor(s / 60)
        const rem = s % 60
        const pad = rem.toString().padStart(2, '0')
        return bilingual(`${m}:${pad}`, `${m}:${pad}`)
      }
      return bilingual(`0:${s.toString().padStart(2, '0')}`, `0:${s.toString().padStart(2, '0')}`)
    },
    logOrdered: (
      name: BilingualTextValue,
      amount: number,
      cost: number,
      delaySecs: number,
    ) => {
      const etaEn = delaySecs >= 60 ? `${Math.round(delaySecs / 60)}m` : `${delaySecs}s`
      const etaTh = delaySecs >= 60 ? `${Math.round(delaySecs / 60)} นาที` : `${delaySecs}s`
      return bilingual(
        `Ordered ${name.en}: ${amount} crude for $${cost}. ETA ${etaEn}.`,
        `สั่งซื้อ ${name.th}: น้ำมันดิบ ${amount} หน่วย ราคา $${cost} ถึงใน ${etaTh}`,
      )
    },
    logArrived: (delivered: number, excess: number) =>
      excess > 0
        ? bilingual(
            `Shipment arrived: +${delivered} crude (${excess} excess discarded).`,
            `ขนส่งมาถึง: +${delivered} น้ำมันดิบ (ทิ้ง ${excess} หน่วยส่วนเกิน)`,
          )
        : bilingual(
            `Shipment arrived: +${delivered} crude.`,
            `ขนส่งมาถึง: +${delivered} น้ำมันดิบ`,
          ),
  },
  devTools: {
    label: bilingual('Dev Tools', 'เครื่องมือทดสอบ'),
    addMoney: bilingual('Add $10,000', 'เพิ่ม $10,000'),
    addRP: bilingual('Add 100 RP', 'เพิ่ม 100 RP'),
    addReputation: bilingual('Add 100 Reputation', 'เพิ่มชื่อเสียง 100'),
    addCrude: bilingual('Add 500 Crude', 'เพิ่มน้ำมันดิบ 500'),
    addGasoline: bilingual('Add 500 Gasoline', 'เพิ่มเบนซิน 500'),
    setLevel5: bilingual('Set Level 5', 'ตั้งระดับ 5'),
    setLevel10: bilingual('Set Level 10', 'ตั้งระดับ 10'),
    triggerEvent: bilingual('Random Event', 'เหตุการณ์สุ่ม'),
    triggerChoiceEvent: bilingual('Choice Event', 'เหตุการณ์ตัดสินใจ'),
    logAddMoney: (amount: number) =>
      bilingual(`[Dev] Added $${amount}.`, `[Dev] เพิ่ม $${amount}`),
    logAddRP: (amount: number) =>
      bilingual(`[Dev] Added ${amount} RP.`, `[Dev] เพิ่ม ${amount} RP`),
    logAddReputation: (amount: number) =>
      bilingual(`[Dev] Added ${amount} reputation.`, `[Dev] เพิ่มชื่อเสียง ${amount}`),
    logAddCrude: (amount: number) =>
      bilingual(`[Dev] Added ${amount} crude.`, `[Dev] เพิ่มน้ำมันดิบ ${amount}`),
    logAddGasoline: (amount: number) =>
      bilingual(`[Dev] Added ${amount} gasoline.`, `[Dev] เพิ่มเบนซิน ${amount}`),
    logSetLevel: (level: number) =>
      bilingual(
        `[Dev] Set refinery level to ${level}.`,
        `[Dev] ตั้งระดับโรงกลั่นเป็น ${level}`,
      ),
  },
  logs: {
    refineryOnline: bilingual(
      'Refinery online. Place buildings to expand storage and output.',
      'โรงกลั่นพร้อมทำงาน วางอาคารเพื่อขยายกำลังผลิตและความจุ',
    ),
    processedCrude: (batches: number, gasolineAmount: number) =>
      bilingual(
        `Processed ${batches} crude into ${gasolineAmount} gasoline.`,
        `แปรรูปน้ำมันดิบ ${batches} หน่วยเป็นเบนซิน ${gasolineAmount} หน่วย`,
      ),
    producedLubricants: (plants: number, amount: number) =>
      bilingual(
        `${plants} lubricant plant${plants > 1 ? 's' : ''} produced ${amount} lubricants.`,
        `โรงผลิต ${plants} แห่งผลิตสารหล่อลื่น ${amount} หน่วย`,
      ),
    producedPlant: (
      productKey: 'lubricants' | 'jetFuel' | 'petrochemicals',
      plants: number,
      amount: number,
    ) => {
      const names: Record<typeof productKey, { en: string; th: string }> = {
        lubricants: { en: 'lubricants', th: 'สารหล่อลื่น' },
        jetFuel: { en: 'jet fuel', th: 'เชื้อเพลิงอากาศยาน' },
        petrochemicals: { en: 'petrochemicals', th: 'ปิโตรเคมี' },
      }
      const n = names[productKey]
      return bilingual(
        `${plants} plant${plants > 1 ? 's' : ''} produced ${amount} ${n.en} from feedstock.`,
        `โรงผลิต ${plants} แห่งผลิต${n.th} ${amount} หน่วยจากวัตถุดิบกลั่น`,
      )
    },
    soldLubricants: (amount: number, totalRevenue: number) =>
      bilingual(
        `Sold ${amount} lubricants for $${totalRevenue.toLocaleString()}.`,
        `ขายสารหล่อลื่น ${amount} หน่วยได้ $${totalRevenue.toLocaleString()}`,
      ),
    producedJetFuelPlant: (plants: number, amount: number) =>
      bilingual(
        `${plants} jet fuel plant${plants > 1 ? 's' : ''} produced ${amount} jet fuel.`,
        `โรงผลิต ${plants} แห่งผลิตเชื้อเพลิงอากาศยาน ${amount} หน่วย`,
      ),
    soldJetFuel: (amount: number, totalRevenue: number) =>
      bilingual(
        `Sold ${amount} jet fuel for $${totalRevenue.toLocaleString()}.`,
        `ขายเชื้อเพลิงอากาศยาน ${amount} หน่วยได้ $${totalRevenue.toLocaleString()}`,
      ),
    producedPetrochemicals: (plants: number, amount: number) =>
      bilingual(
        `${plants} petrochemical plant${plants > 1 ? 's' : ''} produced ${amount} petrochemicals.`,
        `โรงผลิต ${plants} แห่งผลิตปิโตรเคมี ${amount} หน่วย`,
      ),
    soldPetrochemicals: (amount: number, totalRevenue: number) =>
      bilingual(
        `Sold ${amount} petrochemicals for $${totalRevenue.toLocaleString()}.`,
        `ขายปิโตรเคมี ${amount} หน่วยได้ $${totalRevenue.toLocaleString()}`,
      ),
    boughtCrude: (amount: number, totalCost: number) =>
      bilingual(
        `Bought ${amount} crude for $${totalCost}.`,
        `ซื้อน้ำมันดิบ ${amount} หน่วยในราคา $${totalCost}`,
      ),
    soldGasoline: (amount: number, totalRevenue: number) =>
      bilingual(
        `Sold ${amount} gasoline for $${totalRevenue}.`,
        `ขายเบนซิน ${amount} หน่วยได้ $${totalRevenue}`,
      ),
    upgradedRefinery: (level: number) =>
      bilingual(
        `Upgraded refinery to level ${level}.`,
        `อัปเกรดโรงกลั่นเป็นระดับ ${level}`,
      ),
    completedContract: (name: BilingualTextValue, reward: number, rp: number) =>
      bilingual(
        `Completed ${name.en} for $${reward} and ${rp} RP.`,
        `ทำสัญญา ${name.th} สำเร็จ รับ $${reward} และ ${rp} RP`,
      ),
    completedContractWithReputation: (
      name: BilingualTextValue,
      reward: number,
      rp: number,
      reputation: number,
    ) =>
      bilingual(
        `Completed ${name.en} for $${reward}, ${rp} RP, and ${reputation} reputation.`,
        `ทำสัญญา ${name.th} สำเร็จ รับ $${reward}, ${rp} RP และชื่อเสียง ${reputation}`,
      ),
    unlockedResearch: (name: BilingualTextValue, cost: number) =>
      bilingual(
        `Unlocked ${name.en} for ${cost} RP.`,
        `ปลดล็อก ${name.th} ด้วย ${cost} RP`,
      ),
    hiredWorker: (name: BilingualTextValue, cost: number) =>
      bilingual(`Hired ${name.en} for $${cost}.`, `จ้าง ${name.th} ในราคา $${cost}`),
    placedBuilding: (name: BilingualTextValue, cost: number) =>
      bilingual(`Placed ${name.en} for $${cost}.`, `วาง ${name.th} ในราคา $${cost}`),
    removedBuilding: (name: BilingualTextValue) =>
      bilingual(`Removed ${name.en}.`, `ถอด ${name.th} ออกแล้ว`),
    upgradedBuilding: (name: BilingualTextValue, level: number, cost: number) =>
      bilingual(
        `Upgraded ${name.en} to Level ${level} for $${cost.toLocaleString()}.`,
        `อัปเกรด ${name.th} เป็นระดับ ${level} ราคา $${cost.toLocaleString()}`,
      ),
    milestoneFirstFuel: bilingual(
      'Milestone completed: First Fuel. Reward: $300.',
      'ทำหมุดหมายสำเร็จ: First Fuel รับรางวัล $300',
    ),
    milestoneSmallSupplier: bilingual(
      'Milestone completed: Small Supplier. Reward: 5 RP, +10 reputation.',
      'ทำหมุดหมายสำเร็จ: Small Supplier รับรางวัล 5 RP และชื่อเสียง +10',
    ),
    milestoneGrowingRefinery: bilingual(
      'Milestone completed: Growing Refinery. Reward: $1000, +15 reputation.',
      'ทำหมุดหมายสำเร็จ: Growing Refinery รับรางวัล $1000 และชื่อเสียง +15',
    ),
    milestoneResearchBeginner: bilingual(
      'Milestone completed: Research Beginner. Reward: $500, +20 reputation.',
      'ทำหมุดหมายสำเร็จ: Research Beginner รับรางวัล $500 และชื่อเสียง +20',
    ),
    milestoneUpgradeBuilder: bilingual(
      'Milestone completed: First Upgrade. Reward: $500, 5 RP.',
      'ทำหมุดหมายสำเร็จ: First Upgrade รับรางวัล $500 และ 5 RP',
    ),
    milestoneReputedSupplier: bilingual(
      'Milestone completed: Trusted Name. Reward: $800, 10 RP.',
      'ทำหมุดหมายสำเร็จ: Trusted Name รับรางวัล $800 และ 10 RP',
    ),
    milestoneIndustrialProducer: bilingual(
      'Milestone completed: Industrial Producer. Reward: $1,200.',
      'ทำหมุดหมายสำเร็จ: Industrial Producer รับรางวัล $1,200',
    ),
    milestoneRefineryLevel5: bilingual(
      'Milestone completed: Mid-Scale Operations. Reward: $1,500, +20 reputation.',
      'ทำหมุดหมายสำเร็จ: Mid-Scale Operations รับรางวัล $1,500 และชื่อเสียง +20',
    ),
    milestoneResearchAdvanced: bilingual(
      'Milestone completed: Research Pioneer. Reward: $1,000, +15 reputation.',
      'ทำหมุดหมายสำเร็จ: Research Pioneer รับรางวัล $1,000 และชื่อเสียง +15',
    ),
    milestoneContractVeteran: bilingual(
      'Milestone completed: Contract Veteran. Reward: $2,000, 15 RP.',
      'ทำหมุดหมายสำเร็จ: Contract Veteran รับรางวัล $2,000 และ 15 RP',
    ),
    milestoneTierThreeContractor: bilingual(
      'Milestone completed: Premium Contractor. Reward: $3,000, +40 reputation.',
      'ทำหมุดหมายสำเร็จ: Premium Contractor รับรางวัล $3,000 และชื่อเสียง +40',
    ),
    milestoneFullWorkforce: bilingual(
      'Milestone completed: Full Crew. Reward: $3,000, +35 reputation.',
      'ทำหมุดหมายสำเร็จ: Full Crew รับรางวัล $3,000 และชื่อเสียง +35',
    ),
    milestoneJetFuelPioneer: bilingual(
      'Milestone completed: Jet Fuel Pioneer. Reward: $2,500, +25 reputation.',
      'ทำหมุดหมายสำเร็จ: Jet Fuel Pioneer รับรางวัล $2,500 และชื่อเสียง +25',
    ),
    milestoneAviationPartner: bilingual(
      'Milestone completed: Aviation Partner. Reward: $4,000, 30 RP.',
      'ทำหมุดหมายสำเร็จ: Aviation Partner รับรางวัล $4,000 และ 30 RP',
    ),
    milestonePetrochemicalPioneer: bilingual(
      'Milestone completed: Petrochemical Pioneer. Reward: $5,000, +50 reputation.',
      'ทำหมุดหมายสำเร็จ: Petrochemical Pioneer รับรางวัล $5,000 และชื่อเสียง +50',
    ),
    milestoneProductMogul: bilingual(
      'Milestone completed: Product Mogul. Reward: $10,000, +75 reputation.',
      'ทำหมุดหมายสำเร็จ: Product Mogul รับรางวัล $10,000 และชื่อเสียง +75',
    ),
    staffLevelUp: (name: BilingualTextValue, level: number) =>
      bilingual(
        `${name.en} crew reached Level ${level}!`,
        `ทีม ${name.th} เลื่อนเป็นระดับ ${level} แล้ว!`,
      ),
    staffTrained: (name: BilingualTextValue, level: number) =>
      bilingual(
        `${name.en} crew trained to Level ${level}.`,
        `ฝึก ${name.th} ขึ้นเป็นระดับ ${level}`,
      ),
    perkUnlocked: (name: BilingualTextValue) =>
      bilingual(
        `Refinery upgrade installed: ${name.en}.`,
        `ติดตั้งอัปเกรดโรงกลั่น: ${name.th}`,
      ),
    eraAdvanced: (name: BilingualTextValue) =>
      bilingual(
        `New era reached: ${name.en}!`,
        `เข้าสู่ยุคใหม่: ${name.th}!`,
      ),
    annualAward: (year: number, grade: string, cash: number) =>
      bilingual(
        `Year ${year} Awards: Grade ${grade}! +$${cash.toLocaleString()}`,
        `รางวัลประจำปีที่ ${year}: เกรด ${grade}! +$${cash.toLocaleString()}`,
      ),
  },
  workerPresence: {
    decorativeNote: bilingual('Your crew — decorative', 'ทีมงานของคุณ (ตกแต่ง)'),
    overflow: (n: number) => bilingual(`+${n} more`, `+${n} คน`),
  },
} as const
