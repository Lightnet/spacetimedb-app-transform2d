//-----------------------------------------------
// HELPER TRANSFORM 2D
//-----------------------------------------------
// import { t, SenderError } from 'spacetimedb/server';

//-----------------------------------------------
// MATH
//-----------------------------------------------
// Matrix is now stored as a flat array: [a, b, c, d, e, f, 0, 0, 1]  (row-major, 3x3)
export type Matrix2D = [number, number, number, number, number, number, number, number, number];
export const identity: Matrix2D = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function translate2D(x: number, y: number): Matrix2D {
  return [1, 0, x, 0, 1, y, 0, 0, 1];
}

export function rotate2D(angleDeg: number): Matrix2D {
  const rad = angleDeg * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

export function scale2D(sx: number, sy: number): Matrix2D {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

export function multiply2D(a: Matrix2D, b: Matrix2D): Matrix2D {
  return [
    a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
    a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
    a[0]*b[2] + a[1]*b[5] + a[2]*b[8],

    a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
    a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
    a[3]*b[2] + a[4]*b[5] + a[5]*b[8],

    a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
    a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
    a[6]*b[2] + a[7]*b[5] + a[8]*b[8],
  ];
}

export function computeLocal2DMatrix(t: any): Matrix2D {
  const scaleMat   = scale2D(t.scale.x, t.scale.y);
  const rotateMat  = rotate2D(t.rotation);
  const translateMat = translate2D(t.position.x, t.position.y);

  // SRT order: Scale first, then Rotate, then Translate  →  T * R * S
  return multiply2D(translateMat, multiply2D(rotateMat, scaleMat));
}

export function getParentWorldMatrix(dbCtx: any, parentId: string | undefined ): Matrix2D {
  if (!parentId) return identity;

  const parent = dbCtx.db.transform2d.entityId.find(parentId);
  return parent?.worldMatrix ?? identity;   // ← safe fallback
}

// Extract {x, y} from worldMatrix (translation is at indices 2 and 5 in row-major 3x3)
export function extractPositionFromMatrix(mat: Matrix2D): { x: number; y: number } {
  return { x: mat[2], y: mat[5] };
}

/**
 * Extracts scale {x, y} from a 2D matrix.
 * Returns positive lengths (non-negative). 
 * If you need to detect mirroring/flips, check the sign separately.
 */
export function extractScaleFromMatrix(mat: Matrix2D): { x: number; y: number } {
  // Length of first column vector (affected by scaleX and rotation)
  const scaleX = Math.sqrt(mat[0] * mat[0] + mat[3] * mat[3]);
  // Length of second column vector (affected by scaleY and rotation)
  const scaleY = Math.sqrt(mat[1] * mat[1] + mat[4] * mat[4]);
  return { x: scaleX, y: scaleY };
}

/**
 * Extracts rotation in degrees from a 2D matrix (your flat 3x3 format).
 * Works well with your SRT composition order (Scale → Rotate → Translate).
 * Uses atan2 for stability and correct quadrant.
 */
export function extractRotationFromMatrix(mat: Matrix2D): number {
  // mat[0] = a = sx * cos(θ)
  // mat[3] = c = sy * sin(θ)   (in your matrix layout)
  const a = mat[0];
  const c = mat[3];

  const rotationRad = Math.atan2(c, a);
  let rotationDeg = rotationRad * (180 / Math.PI);

  // Optional: normalize to [0, 360) range
  rotationDeg = ((rotationDeg % 360) + 360) % 360;

  return rotationDeg;
}

/**
 * Combined extraction for convenience (rotation + scale in one call)
 */
export function extractRotationAndScaleFromMatrix(mat: Matrix2D): {
  rotationDeg: number;
  scale: { x: number; y: number };
} {
  return {
    rotationDeg: extractRotationFromMatrix(mat),
    scale: extractScaleFromMatrix(mat)
  };
}
