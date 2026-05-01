import fs from 'fs';
import path from 'path';
import { loadBaselineRequireDat } from './baselineLoader.js';
import { serializeRequirements } from './binarySerializer.js';
import { generateTriggers } from './triggerGenerator.js';

/**
 * Generate RequireData binary and EUD trigger code.
 *
 * @param {string} buildDir - The target build directory.
 * @param {object} projectData - The edited project data.
 * @returns {string} Trigger script snippet to be inserted into EEData.py.
 */
export async function generateRequirements(buildDir, projectData) {
  const baseReqData = loadBaselineRequireDat();
  
  if (!baseReqData) {
    console.warn('[generateRequirements] Proceeding without baseline data. Unedited items may reset.');
  }

  // Categories config mapping fixed boundaries equivalent to VB's Ptr() arrays
  // table: FG_PReq* addresses (pointer tables updated by SetMemory triggers in beforeTriggerExec)
  // dataAddress: FG_Req* addresses (where RequireData binary is loaded via dataDumper)
  const categories = [
    { name: 'units',    count: 228, table: '0x660A70', dataAddress: '0x514178', fixedSize: 1096 },
    { name: 'upgrades', count: 61,  table: '0x6558C0', dataAddress: '0x5145C0', fixedSize: 840  },
    { name: 'techs',    count: 44,  table: '0x656198', dataAddress: '0x514908', fixedSize: 320  },
    { name: 'techUses', count: 44,  table: '0x6562F8', dataAddress: '0x514A48', fixedSize: 688  },
    { name: 'orders',   count: 189, table: '0x665580', dataAddress: '0x514CF8', fixedSize: 1316 }
  ];

  // 1. Serialize binary and compile offset map
  const { buffer, offsetMaps } = serializeRequirements(categories, projectData, baseReqData);

  // Output to Data/temp/RequireData just like original logic
  const tempDir = path.join(buildDir, 'Data', 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'RequireData'), buffer);

  // 2. Generate EUD triggers bridging requirements memory
  const triggerScript = generateTriggers(categories, offsetMaps);

  return triggerScript;
}
