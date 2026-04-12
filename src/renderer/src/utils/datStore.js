/**
 * datStore.js
 *
 * Module-level singleton that loads and parses all .dat and .tbl files once at startup.
 * After the first load, data is kept in memory and returned immediately.
 */
import { parseDef, parseDat } from './datParser'
import { parseTbl } from './tblParser'

// --- DAT static imports ---
import unitsDefText    from '../dat/units.def?raw'
import unitsDatUrl     from '../dat/units.dat?url'
import flingyDefText   from '../dat/flingy.def?raw'
import flingyDatUrl    from '../dat/flingy.dat?url'
import imagesDefText   from '../dat/images.def?raw'
import imagesDatUrl    from '../dat/images.dat?url'
import ordersDefText   from '../dat/orders.def?raw'
import ordersDatUrl    from '../dat/orders.dat?url'
import portdataDefText from '../dat/portdata.def?raw'
import portdataDatUrl  from '../dat/portdata.dat?url'
import sfxdataDefText  from '../dat/sfxdata.def?raw'
import sfxdataDatUrl   from '../dat/sfxdata.dat?url'
import spritesDefText  from '../dat/sprites.def?raw'
import spritesDatUrl   from '../dat/sprites.dat?url'
import techdataDefText from '../dat/techdata.def?raw'
import techdataDatUrl  from '../dat/techdata.dat?url'
import upgradesDefText from '../dat/upgrades.def?raw'
import upgradesDatUrl  from '../dat/upgrades.dat?url'
import weaponsDefText  from '../dat/weapons.def?raw'
import weaponsDatUrl   from '../dat/weapons.dat?url'
import statusInforDefText from '../dat/statusInfor.def?raw'
import statusInforDatUrl  from '../dat/statusInfor.dat?url'
import requireDatUrl      from '../dat/require.dat?url'

// --- TBL static imports ---
import statTxtUrl       from '../tbl/stat_txt.tbl?url'
import statTxtKorEngUrl from '../tbl/stat_txt_kor_eng.tbl?url'
import statTxtKorKorUrl from '../tbl/stat_txt_kor_kor.tbl?url'
import portdataTblUrl   from '../tbl/portdata.tbl?url'
import sfxdataTblUrl    from '../tbl/sfxdata.tbl?url'
import imagesTblUrl     from '../tbl/images.tbl?url'

// In-memory cache
const _store = {
  // DAT
  units:    null,
  flingy:   null,
  images:   null,
  orders:   null,
  portdata: null,
  sfxdata:  null,
  sprites:  null,
  techdata: null,
  upgrades: null,
  weapons:  null,
  statusInfor: null,
  // TBL
  statTxt:       null,  // English unit/ability names
  statTxtKorEng: null,  // Korean-English mixed
  statTxtKorKor: null,  // Korean only
  portdataTbl:   null,  // Portrait descriptions
  sfxdataTbl:    null,  // SFX file paths
  imagesTbl:     null,  // Image paths
  
  // Parsed Require Data
  requireData:   null,
}

let _initPromise = null

async function _parseDatFile(defText, datUrl) {
  const defData = parseDef(defText)
  console.log(`[datStore] Fetching DAT from: ${datUrl}`)
  const res = await fetch(datUrl)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} when fetching DAT: ${datUrl}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return await parseDat(arrayBuffer, defData)
}

async function _parseTblFile(url, encoding = 'EUC-KR') {
  console.log(`[datStore] Fetching TBL from: ${url}`)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} when fetching TBL: ${url}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return await parseTbl(arrayBuffer, encoding)
}

/**
 * Loads all .dat and .tbl files once and caches them.
 * Safe to call multiple times - only runs once.
 */
const S_ADDRS = [4343040, 4344192, 4346240, 4345616, 4344656, 4344560, 4344512, 4348160, 4343072]
const D_ADDRS = [4353872, 4356240, 4357264, 4355232, 4355040, 4354656, 4357424, 4353760, 4349664]

const getUnitType = (s, d) => {
  if (s === 2 && d === 1) return 0;
  if (s === 1 && d === 0) return 1;
  if (s === 4 && d === 3) return 2;
  if (s === 3 && d === 2) return 3;
  if (s === 7 && d === 6) return 4;
  if (s === 8 && d === 7) return 5;
  if (s === 6 && d === 5) return 6;
  if (s === 5 && d === 4) return 7;
  if (s === 0 && d === 8) return 8;
  if (s === 1 && d === 8) return 9;
  if (s === 2 && d === 8) return 10;
  return 1;
}

export function initDatStore() {
  if (_initPromise) return _initPromise

  _initPromise = Promise.all([
    // DAT files
    _parseDatFile(unitsDefText,    unitsDatUrl),
    _parseDatFile(flingyDefText,   flingyDatUrl),
    _parseDatFile(imagesDefText,   imagesDatUrl),
    _parseDatFile(ordersDefText,   ordersDatUrl),
    _parseDatFile(portdataDefText, portdataDatUrl),
    _parseDatFile(sfxdataDefText,  sfxdataDatUrl),
    _parseDatFile(spritesDefText,  spritesDatUrl),
    _parseDatFile(techdataDefText, techdataDatUrl),
    _parseDatFile(upgradesDefText, upgradesDatUrl),
    _parseDatFile(weaponsDefText,  weaponsDatUrl),
    
    // Manual statusInfor parsing
    fetch(statusInforDatUrl).then(res => res.arrayBuffer()).then(buf => {
      const dv = new DataView(buf)
      const arr = []
      for (let i = 0; i < 228; i++) {
        // const debugId = dv.getUint32(i * 12, true)
        const sAddr = dv.getUint32(i * 12 + 4, true)
        const dAddr = dv.getUint32(i * 12 + 8, true)
        
        let s = S_ADDRS.indexOf(sAddr)
        let d = D_ADDRS.indexOf(dAddr)
        if (s === -1) s = 1
        if (d === -1) d = 0
        const t = getUnitType(s, d)
        
        arr.push({
          'Unit Type': t,
          'Status Function': s,
          'Display Function': d
        })
      }
      return arr
    }),

    // TBL files
    _parseTblFile(statTxtUrl,       'UTF-8'),    // English — ASCII-safe
    _parseTblFile(statTxtKorEngUrl, 'EUC-KR'),
    _parseTblFile(statTxtKorKorUrl, 'EUC-KR'),
    _parseTblFile(portdataTblUrl,   'EUC-KR'),
    _parseTblFile(sfxdataTblUrl,    'UTF-8'),    // SFX paths, ASCII-safe
    _parseTblFile(imagesTblUrl,     'UTF-8'),    // images paths, ASCII-safe

    // Require.dat
    import('./requireDataParser').then(m => m.parseRequireDatFile(requireDatUrl))
  ]).then(([
    units, flingy, images, orders, portdata, sfxdata, sprites, techdata, upgrades, weapons, statusInfor,
    statTxt, statTxtKorEng, statTxtKorKor, portdataTbl, sfxdataTbl, imagesTbl, requireData
  ]) => {
    _store.units    = units
    _store.flingy   = flingy
    _store.images   = images
    _store.orders   = orders
    _store.portdata = portdata
    _store.sfxdata  = sfxdata
    _store.sprites  = sprites
    _store.techdata = techdata
    _store.upgrades = upgrades
    _store.weapons  = weapons
    _store.statusInfor = statusInfor
    _store.statTxt       = statTxt
    _store.statTxtKorEng = statTxtKorEng
    _store.statTxtKorKor = statTxtKorKor
    _store.portdataTbl   = portdataTbl
    _store.sfxdataTbl    = sfxdataTbl
    _store.imagesTbl     = imagesTbl
    _store.requireData   = requireData
    console.log('[datStore] Loaded all files:',
      Object.fromEntries(Object.entries(_store).map(([k, v]) => [k, v?.length]))
    )
  }).catch(err => {
    const errorPrefix = '[datStore] Failed to initialize:'
    console.error(errorPrefix, err)
    alert(`${errorPrefix}\n${err.message}\n\nPlease check the browser console for details.`)
    _initPromise = null
  })

  return _initPromise
}

// --- DAT Getters ---
export const getUnitsData    = () => _store.units
export const getFlingyData   = () => _store.flingy
export const getImagesData   = () => _store.images
export const getOrdersData   = () => _store.orders
export const getPortdataData = () => _store.portdata
export const getSfxdataData  = () => _store.sfxdata
export const getSpritesData  = () => _store.sprites
export const getTechdataData = () => _store.techdata
export const getUpgradesData = () => _store.upgrades
export const getWeaponsData  = () => _store.weapons
export const getStatusInforData = () => _store.statusInfor

// --- TBL Getters ---
export const getStatTxt       = () => _store.statTxt        // English names (stat_txt.tbl)
export const getStatTxtKorEng = () => _store.statTxtKorEng  // Korean+English mixed
export const getStatTxtKorKor = () => _store.statTxtKorKor  // Korean only
export const getPortdataTbl   = () => _store.portdataTbl    // Portrait descriptions
export const getSfxdataTbl    = () => _store.sfxdataTbl     // SFX file paths
export const getImagesTbl     = () => _store.imagesTbl      // Image paths

// --- Require.dat Getter ---
export const getRequireData   = (category, id) => {
  if (!_store.requireData) return null
  if (!_store.requireData[category]) return null
  return _store.requireData[category][id] || null
}
