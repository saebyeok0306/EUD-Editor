import fs from 'fs';
import path from 'path';
import scmExtractor from 'scm-extractor'

const createExtractor = scmExtractor.default || scmExtractor

import { readDatapackFile } from '../cascPacker.js'
import { extractChkSection, parseUnixSection } from '../chkParser.js'
import { generateRequirements } from './requirements/index.js';

/**
 * units.dat Variable Sizes (for 228 units)
 * Derived from units.def
 */
const UNIT_DAT_SIZES = [
  1, 2, 2, 2, 4, 1, 1, 2, 4, 1, // 0-9
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 10-19
  1, 1, 4, 1, 1, 1, 1, 1, 1, 2, // 20-29
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 30-39
  2, 2, 2, 2, 2, 2, 2, 2, 2, 1, // 40-49
  1, 1, 1, 1, 2, 2, 2, 1, 2      // 50-58
]

/**
 * Property categories and their handling strategies.
 * DELTA: unit.prop += (New - Baseline)
 * ASSIGN: unit.prop = New
 */
const PROPERTY_STRATEGIES = {
  // UnitTab
  // BasicInfo
  maxHp: { strategy: 'DELTA', unit: 256, datVar: 8, datSize: 4, chkKey: 'rawHp' },
  maxShield: { strategy: 'DELTA', unit: 1, datVar: 7, datSize: 2, chkKey: 'shield' },
  armor: { strategy: 'DELTA', unit: 1, datVar: 27, datSize: 1, chkKey: 'armor' },
  mineralCost: { strategy: 'DELTA', unit: 1, datVar: 45, datSize: 2, chkKey: 'minerals' },
  gasCost: { strategy: 'DELTA', unit: 1, datVar: 46, datSize: 2, chkKey: 'gas' },
  timeCost: { strategy: 'DELTA', unit: 1, datVar: 47, datSize: 2, chkKey: 'buildTime' },
  supplyUsed: { strategy: 'DELTA', unit: 1, datVar: 51, datSize: 1 },
  supplyProvided: { strategy: 'DELTA', unit: 1, datVar: 50, datSize: 1 },
  sightRange: { strategy: 'DELTA', unit: 1, datVar: 24, datSize: 1 },
  seekRange: { strategy: 'DELTA', unit: 1, datVar: 23, datSize: 1 },
  transportSpaceRequired: { strategy: 'DELTA', unit: 1, datVar: 52, datSize: 1 },
  transportSpaceProvided: { strategy: 'DELTA', unit: 1, datVar: 53, datSize: 1 },
  buildScore: { strategy: 'DELTA', unit: 1, datVar: 54, datSize: 2 },
  killScore: { strategy: 'DELTA', unit: 1, datVar: 55, datSize: 2 },
  sizeType: { strategy: 'ASSIGN' },
  
  // Advanced
  baseProperty: { strategy: 'ASSIGN' },
  movementFlags: { strategy: 'ASSIGN' },
  infestationUnit: { strategy: 'ASSIGN' },
  subUnit: { strategy: 'ASSIGN' },
  subunit2: { strategy: 'ASSIGN' },

  // Sound
  readySound: { strategy: 'ASSIGN' },
  yesSoundStart: { strategy: 'ASSIGN' },
  yesSoundEnd: { strategy: 'ASSIGN' },
  whatSoundStart: { strategy: 'ASSIGN' },
  whatSoundEnd: { strategy: 'ASSIGN' },
  pissedSoundStart: { strategy: 'ASSIGN' },
  pissedSoundEnd: { strategy: 'ASSIGN' },

  // Graphic
  flingy: { strategy: 'ASSIGN' },
  constructionGraphic: { strategy: 'ASSIGN' },
  portrait: { strategy: 'ASSIGN' },
  elevation: { strategy: 'ASSIGN' },
  startDirection: { strategy: 'ASSIGN' },
  buildingDimensions: { strategy: 'ASSIGN' },
  starEditPlacementBoxWidth: { strategy: 'IGNORE', datVar: 36, datSize: 2 },
  starEditPlacementBoxHeight: { strategy: 'IGNORE', datVar: 37, datSize: 2 },
  
  // Edit
  rank: { strategy: 'DELTA' },
  
  // AI/Order
  computerIdleOrder: { strategy: 'ASSIGN' },
  humanIdleOrder: { strategy: 'ASSIGN' },
  returnToIdleOrder: { strategy: 'ASSIGN' },
  attackUnitOrder: { strategy: 'ASSIGN' },
  attackMoveOrder: { strategy: 'ASSIGN' },
  rightClickAction: { strategy: 'ASSIGN' },
  ignoreStrategicSuicideMissions: { strategy: 'ASSIGN' },
  dontBecomeGuard: { strategy: 'ASSIGN' }
}

export async function generateEEData(buildDir, data, { mapPath, userDataPath }) {
  // 1. Load Baseline: units.dat
  const packPath = path.join(userDataPath, 'casc.datapack')
  const unitsDat = readDatapackFile(packPath, 'arr/units.dat')
  
  // 2. Load Baseline: Map CHK (UNIx)
  let mapUnitOverrides = {}
  try {
    const chkData = await new Promise((resolve, reject) => {
      const extractor = createExtractor()
      const chunks = []
      extractor.on('data', chunk => chunks.push(chunk))
      extractor.on('end', () => resolve(Buffer.concat(chunks)))
      extractor.on('error', err => reject(err))
      fs.createReadStream(mapPath).pipe(extractor)
    })
    
    // Extract UNIx (BW) or UNIS (Original)
    const unixBuf = extractChkSection(chkData, 'UNIx') || extractChkSection(chkData, 'UNIS')
    if (unixBuf) {
      const parsed = parseUnixSection(unixBuf)
      if (parsed && parsed.units) {
        parsed.units.forEach(u => {
          if (!u.useDefault) mapUnitOverrides[u.id] = u
        })
      }
    }
  } catch (err) {
    console.error('[Build] Failed to parse map for baseline:', err)
  }

  const getBaseline = (unitId, key) => {
    const meta = PROPERTY_STRATEGIES[key]
    if (!meta) return 0
    
    if (meta.baselineValue !== undefined) {
      return meta.baselineValue
    }
    
    // Check Map Override first (for numeric properties supported by UNIx)
    if (mapUnitOverrides[unitId] && meta.chkKey && mapUnitOverrides[unitId][meta.chkKey] !== undefined) {
      return mapUnitOverrides[unitId][meta.chkKey]
    }
    
    // Fallback to units.dat
    if (unitsDat && meta.datVar !== undefined) {
      // Calculate start offset of this variable array
      // Some variables don't have 228 entries according to units.def
      const getVarCount = (idx) => {
        if (idx === 3 || idx === 38 || idx === 39) return 96; // 106 to 201
        if ([29, 32, 33, 34, 35].includes(idx)) return 106; // 0 to 105
        return 228;
      };

      let varStartOffset = 0
      for (let i = 0; i < meta.datVar; i++) {
        varStartOffset += UNIT_DAT_SIZES[i] * getVarCount(i)
      }
      
      // Determine actual offset based on unit ID and VarStart
      let unitIndex = Number(unitId);
      if (meta.datVar === 3 || meta.datVar === 38 || meta.datVar === 39) {
         unitIndex -= 106;
      }
      
      if (unitIndex >= 0 && unitIndex < getVarCount(meta.datVar)) {
        const offset = varStartOffset + unitIndex * meta.datSize
        if (offset + meta.datSize <= unitsDat.length) {
          if (meta.datSize === 1) return unitsDat.readUInt8(offset)
          if (meta.datSize === 2) return unitsDat.readUInt16LE(offset)
          if (meta.datSize === 4) return unitsDat.readUInt32LE(offset)
        }
      }
    }
    return 0
  }

  const generateUnitCode = (unitId, unitData) => {
    const lines = []
    
    for (const [key, newValue] of Object.entries(unitData || {})) {
      if (key === 'reqData') continue
      
      const meta = PROPERTY_STRATEGIES[key]
      if (meta?.strategy === 'IGNORE') continue

      if (!meta || meta.strategy === 'ASSIGN') {
        lines.push(`    unit${unitId}.${key} = ${newValue}`)
      } else if (meta.strategy === 'DELTA') {
        const delta = Number(newValue) - getBaseline(unitId, key)
        if (delta !== 0) {
          const operator = delta > 0 ? '+=' : '-='
          lines.push(`    unit${unitId}.${key} ${operator} ${Math.abs(delta)}`)
        }
      }
    }

    // Handle composite properties (building dimensions)
    if (unitData.starEditPlacementBoxWidth !== undefined || unitData.starEditPlacementBoxHeight !== undefined) {
      const w = unitData.starEditPlacementBoxWidth ?? getBaseline(unitId, 'starEditPlacementBoxWidth')
      const h = unitData.starEditPlacementBoxHeight ?? getBaseline(unitId, 'starEditPlacementBoxHeight')
      lines.push(`    unit${unitId}.buildingDimensions = ${Number(w) + Number(h) * 65536}`)
    }

    // Wrap with Trigger Unit initialization if there are actual modifications
    if (lines.length > 0) {
      return [`    unit${unitId} = TrgUnit(${unitId})`, ...lines].join('\n')
    }
    return ''
  }

  const unitPart = Object.entries(data.units || {})
    .map(([id, unitData]) => generateUnitCode(id, unitData))
    .filter(Boolean)
    .join('\n\n')

  const reqTriggerPart = await generateRequirements(buildDir, data, { userDataPath });

  const pyContent = `from eudplib import *
# THIS IS AUTOGENERATED BY EUD-EDITOR
# DATA REFLECTION SCRIPT

def onPluginStart():
    pass
    # ---------------------------------------------
    # EUD Editor Data Modifications Summary
    # ---------------------------------------------
    print("Units modified: ${Object.keys(data.units || {}).length}")
    print("Weapons modified: ${Object.keys(data.weapons || {}).length}")
    print("Upgrades modified: ${Object.keys(data.upgrades || {}).length}")
    print("Images modified: ${Object.keys(data.images || {}).length}")

${unitPart}

def beforeTriggerExec():
    pass

def afterTriggerExec():
    pass
`

  const requirePyContent = `from eudplib import *
import os

def onPluginStart():
    # RequireData payload manual injection
    require_dat_path = os.path.join('../Data/temp/RequireData')
    with open(require_dat_path, 'rb') as file:
        inputData = file.read()
        inputData_db = Db(inputData)
        inputDwordN = (len(inputData) + 3) // 4

    addrEPD = EPD(0x514178)
    f_repmovsd_epd(addrEPD, EPD(inputData_db), inputDwordN)

def beforeTriggerExec():
${reqTriggerPart}

def afterTriggerExec():
    pass
`

  const configDir = path.join(buildDir, '.eudeditor')
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
  fs.writeFileSync(path.join(configDir, 'EEData.py'), pyContent, 'utf-8')
  fs.writeFileSync(path.join(configDir, 'EERequire.py'), requirePyContent, 'utf-8')
}
