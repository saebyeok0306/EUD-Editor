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

// --- TBL static imports ---
import statTxtUrl       from '../tbl/stat_txt.tbl?url'
import statTxtKorEngUrl from '../tbl/stat_txt_kor_eng.tbl?url'
import statTxtKorKorUrl from '../tbl/stat_txt_kor_kor.tbl?url'
import portdataTblUrl   from '../tbl/portdata.tbl?url'
import sfxdataTblUrl    from '../tbl/sfxdata.tbl?url'

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
  // TBL
  statTxt:       null,  // English unit/ability names
  statTxtKorEng: null,  // Korean-English mixed
  statTxtKorKor: null,  // Korean only
  portdataTbl:   null,  // Portrait descriptions
  sfxdataTbl:    null,  // SFX file paths
}

let _initPromise = null

async function _parseDatFile(defText, datUrl) {
  const defData = parseDef(defText)
  const res = await fetch(datUrl)
  const arrayBuffer = await res.arrayBuffer()
  return parseDat(arrayBuffer, defData)
}

async function _parseTblFile(url, encoding = 'EUC-KR') {
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  return parseTbl(arrayBuffer, encoding)
}

/**
 * Loads all .dat and .tbl files once and caches them.
 * Safe to call multiple times - only runs once.
 */
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
    // TBL files
    _parseTblFile(statTxtUrl,       'UTF-8'),    // English — ASCII-safe
    _parseTblFile(statTxtKorEngUrl, 'EUC-KR'),
    _parseTblFile(statTxtKorKorUrl, 'EUC-KR'),
    _parseTblFile(portdataTblUrl,   'EUC-KR'),
    _parseTblFile(sfxdataTblUrl,    'UTF-8'),    // SFX paths, ASCII-safe
  ]).then(([
    units, flingy, images, orders, portdata, sfxdata, sprites, techdata, upgrades, weapons,
    statTxt, statTxtKorEng, statTxtKorKor, portdataTbl, sfxdataTbl,
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
    _store.statTxt       = statTxt
    _store.statTxtKorEng = statTxtKorEng
    _store.statTxtKorKor = statTxtKorKor
    _store.portdataTbl   = portdataTbl
    _store.sfxdataTbl    = sfxdataTbl
    console.log('[datStore] Loaded all files:',
      Object.fromEntries(Object.entries(_store).map(([k, v]) => [k, v?.length]))
    )
  }).catch(err => {
    console.error('[datStore] Failed to initialize:', err)
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

// --- TBL Getters ---
export const getStatTxt       = () => _store.statTxt        // English names (stat_txt.tbl)
export const getStatTxtKorEng = () => _store.statTxtKorEng  // Korean+English mixed
export const getStatTxtKorKor = () => _store.statTxtKorKor  // Korean only
export const getPortdataTbl   = () => _store.portdataTbl    // Portrait descriptions
export const getSfxdataTbl    = () => _store.sfxdataTbl     // SFX file paths
