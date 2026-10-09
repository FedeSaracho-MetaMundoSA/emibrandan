/**
 * Listado oficial de lotes vendidos de Riveras de Pucheta (ArgenSALTA).
 * Total: 191 lotes vendidos
 */
export const LOTES_VENDIDOS_LIST: number[] = [
  // Manzana A / Acceso (1 a 37)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,

  // Manzana A - Lotes 53 a 57
  53, 54, 55, 56, 57,

  // Manzana A - Lote 64
  64,

  // Manzana A - Lotes 69 a 75 y 78
  69, 70, 71, 72, 73, 74, 75, 78,

  // Manzana B - Lotes 87 a 95
  87, 88, 89, 90, 91, 92, 93, 94, 95,

  // Manzana B - Lotes 108, 109, 111
  108, 109, 111,

  // Manzana C - Lotes 123 a 127, 130, 132, 133
  123, 124, 125, 126, 127, 130, 132, 133,

  // Manzana C / E - Lotes 141, 144, 145, 148
  141, 144, 145, 148,

  // Manzana E - Lotes 157, 160 a 166
  157, 160, 161, 162, 163, 164, 165, 166,

  // Manzana E - Lotes 180, 181
  180, 181,

  // Manzana E - Lotes 194, 195, 197 a 200, 203
  194, 195, 197, 198, 199, 200, 203,

  // Manzana E / G - Lotes 216, 217
  216, 217,

  // Manzana G - Lotes 232 a 236
  232, 233, 234, 235, 236,

  // Manzana G - Lotes 252 a 254
  252, 253, 254,

  // Manzana G - Lote 261
  261,

  // Manzana G - Lotes 265 a 274
  265, 266, 267, 268, 269, 270, 271, 272, 273, 274,

  // Manzana G - Lote 277
  277,

  // Manzana G - Lote 284
  284,

  // Manzana G / I - Lotes 287 a 290
  287, 288, 289, 290,

  // Manzana I - Lotes 301 a 307, 309, 313
  301, 302, 303, 304, 305, 306, 307, 309, 313,

  // Manzana I - Lotes 315 a 318
  315, 316, 317, 318,

  // Manzana I, K, L - Lotes 320 a 378
  320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330,
  331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346,
  347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362,
  363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378
];

export const LOTES_VENDIDOS_SET = new Set<number>(LOTES_VENDIDOS_LIST);

export function isLoteVendido(numero: number): boolean {
  return LOTES_VENDIDOS_SET.has(numero);
}
