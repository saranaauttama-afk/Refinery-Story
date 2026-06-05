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
    gasoline: bilingual('Gasoline', 'น้ำมันเบนซิน'),
    gasolineDescription: bilingual(
      'Product Tanks raise finished fuel storage.',
      'ถังเก็บผลิตภัณฑ์ช่วยเพิ่มความจุเชื้อเพลิงที่ผลิตแล้ว',
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
    sellGasoline10Button: bilingual('Sell 10 Gasoline', 'ขายเบนซิน 10 หน่วย'),
    sellGasoline50Button: bilingual('Sell 50 Gasoline', 'ขายเบนซิน 50 หน่วย'),
    sellGasolineAllButton: (amount: number) =>
      bilingual(`Sell All (${amount})`, `ขายทั้งหมด (${amount})`),
    upgradeRefineryButton: (cost: number) =>
      bilingual(`Upgrade Refinery ($${cost})`, `อัปเกรดโรงกลั่น ($${cost})`),
  },
  stats: {
    kicker: bilingual('Current Stats', 'ค่าสถิติปัจจุบัน'),
    title: (level: number) =>
      bilingual(`Refinery Level ${level}`, `ระดับโรงกลั่น ${level}`),
    helper: bilingual(
      'Current production rate after buildings, upgrades, research, and staff.',
      'อัตราการผลิตปัจจุบันหลังรวมอาคาร อัปเกรด วิจัย และพนักงาน',
    ),
    productionRate: bilingual('Production rate', 'อัตราการผลิต'),
    productionRateValue: (value: string) =>
      bilingual(`${value} gasoline/sec`, `${value} เบนซินต่อวินาที`),
    sellPrice: bilingual('Sell price', 'ราคาขาย'),
    maxCrude: bilingual('Max crude', 'ความจุน้ำมันดิบสูงสุด'),
    maxGasoline: bilingual('Max gasoline', 'ความจุเบนซินสูงสุด'),
    openCells: bilingual('Open cells', 'ช่องว่าง'),
  },
  refineryProgression: {
    kicker: bilingual('Refinery', 'โรงกลั่น'),
    title: bilingual('Level Progression', 'ความก้าวหน้าของระดับ'),
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
    triggerButton: bilingual('Trigger Test Event', 'เรียกเหตุการณ์ทดสอบ'),
    triggerChoiceButton: bilingual('Trigger Choice Event', 'เรียกเหตุการณ์ตัดสินใจ'),
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
  milestones: {
    kicker: bilingual('Milestones', 'หมุดหมาย'),
    title: bilingual('Progress Goals', 'เป้าหมายความก้าวหน้า'),
    rewardLabel: (reward: string) =>
      bilingual(`Reward: ${reward}`, `รางวัล: ${reward}`),
    completed: bilingual('Completed', 'สำเร็จแล้ว'),
    inProgress: bilingual('In Progress', 'กำลังดำเนินการ'),
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
    hireButton: bilingual('Hire', 'จ้าง'),
  },
  workforce: {
    kicker: bilingual('Workforce', 'กำลังแรงงาน'),
    title: bilingual('Active Workforce', 'พนักงานที่ทำงาน'),
    totalStaff: (count: number) => bilingual(`${count} staff`, `${count} คน`),
    noStaff: bilingual('No staff hired yet.', 'ยังไม่มีพนักงาน'),
  },
  contracts: {
    kicker: bilingual('Orders', 'คำสั่งซื้อ'),
    title: bilingual('Fuel Contracts', 'สัญญาจัดส่งเชื้อเพลิง'),
    fulfillButton: bilingual('Fulfill Order', 'ส่งมอบสัญญา'),
    completedButton: bilingual('Completed', 'สำเร็จแล้ว'),
    lockedButton: bilingual('Locked', 'ยังล็อกอยู่'),
    tierLabel: (tier: number) => bilingual(`Tier ${tier}`, `ระดับ ${tier}`),
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
        `Deliver ${gasolineRequired} gasoline for $${reward}, ${rpReward} RP, and ${reputationReward} reputation.`,
        `ส่งมอบเบนซิน ${gasolineRequired} หน่วย เพื่อรับ $${reward}, ${rpReward} RP และชื่อเสียง ${reputationReward}`,
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
    buildings: {
      crudeTank: {
        name: bilingual('Crude Tank', 'ถังน้ำมันดิบ'),
        description: bilingual('+25 max crude storage', '+25 ความจุน้ำมันดิบสูงสุด'),
      },
      distillationUnit: {
        name: bilingual('Distillation Unit', 'หน่วยกลั่น'),
        description: bilingual('-120ms production time', '-120ms เวลาการผลิต'),
      },
      productTank: {
        name: bilingual('Product Tank', 'ถังเก็บผลิตภัณฑ์'),
        description: bilingual('+25 max gasoline storage', '+25 ความจุเบนซินสูงสุด'),
      },
      laboratory: {
        name: bilingual('Laboratory', 'ห้องปฏิบัติการ'),
        description: bilingual(
          '+10% research points earned from contracts',
          '+10% คะแนนวิจัยที่ได้รับจากสัญญา',
        ),
      },
      maintenanceWorkshop: {
        name: bilingual('Maintenance Workshop', 'โรงซ่อมบำรุง'),
        description: bilingual(
          'Reduces negative event penalties by 50%',
          'ลดผลเสียจากเหตุการณ์เชิงลบลง 50%',
        ),
      },
      salesOffice: {
        name: bilingual('Sales Office', 'สำนักงานขาย'),
        description: bilingual(
          '+10% contract money rewards',
          '+10% รางวัลเงินจากสัญญา',
        ),
      },
    } satisfies Record<
      BuildingType,
      { name: BilingualTextValue; description: BilingualTextValue }
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
        reward: '$500',
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
    } satisfies Record<
      RandomEventKey,
      { name: BilingualTextValue; message: BilingualTextValue }
    >,
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
          'Decline ethically (+5 reputation, −$500)',
          'ปฏิเสธอย่างมีจริยธรรม (+5 ชื่อเสียง, −$500)',
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
    step1: bilingual('Buy crude oil', 'ซื้อน้ำมันดิบ'),
    step2: bilingual('Let refinery produce gasoline', 'ปล่อยให้โรงกลั่นผลิตเบนซิน'),
    step3: bilingual('Complete your first contract', 'ทำสัญญาแรกให้สำเร็จ'),
    dismissButton: bilingual('Dismiss', 'ปิด'),
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
    milestoneFirstFuel: bilingual(
      'Milestone completed: First Fuel. Reward: $300.',
      'ทำหมุดหมายสำเร็จ: First Fuel รับรางวัล $300',
    ),
    milestoneSmallSupplier: bilingual(
      'Milestone completed: Small Supplier. Reward: 5 RP.',
      'ทำหมุดหมายสำเร็จ: Small Supplier รับรางวัล 5 RP',
    ),
    milestoneGrowingRefinery: bilingual(
      'Milestone completed: Growing Refinery. Reward: $1000.',
      'ทำหมุดหมายสำเร็จ: Growing Refinery รับรางวัล $1000',
    ),
    milestoneResearchBeginner: bilingual(
      'Milestone completed: Research Beginner. Reward: $500.',
      'ทำหมุดหมายสำเร็จ: Research Beginner รับรางวัล $500',
    ),
  },
} as const
