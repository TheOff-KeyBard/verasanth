/**
 * Vendor stock — re-exports authoritative catalog (see vendor_catalog.js).
 */

import {
  VENDOR_CATALOG,
  VENDOR_NPCS,
  THALARA_STOCK,
  CAELIR_STOCK,
  VEYRA_STOCK,
  getBuyPrice,
  getSellPrice,
  getVendorStock,
  getShopBrowseRows,
  legacyEquipVendorRow,
} from "./vendor_catalog.js";

export {
  VENDOR_CATALOG,
  VENDOR_NPCS,
  THALARA_STOCK,
  CAELIR_STOCK,
  VEYRA_STOCK,
  getBuyPrice,
  getSellPrice,
  getVendorStock,
  getShopBrowseRows,
  legacyEquipVendorRow,
};

export const VENDOR_STOCK = VENDOR_CATALOG;
