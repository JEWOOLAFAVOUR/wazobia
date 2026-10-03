package movement

import "math"

// Bounds of the Yaba MVP map (matches frontend collision + world handler).
const (
	MinX = -55.0
	MaxX = 55.0
	MinZ = -55.0
	MaxZ = 55.0
	// MaxSpeed m/s: 8 walk, 12 run, 15 tolerance for jitter/lag.
	MaxSpeed = 15.0
)

// ValidateMove clamps and rejects impossible teleports.
// Returns corrected x,z and true if the move should be relayed.
// Server is authoritative over position (§25); client predicts locally.
func ValidateMove(prevX, prevZ, nextX, nextZ float64, dtSeconds float64, first bool) (float64, float64, bool) {
	if math.IsNaN(nextX) || math.IsNaN(nextZ) || math.IsInf(nextX, 0) || math.IsInf(nextZ, 0) {
		return prevX, prevZ, false
	}
	x := math.Max(MinX, math.Min(MaxX, nextX))
	z := math.Max(MinZ, math.Min(MaxZ, nextZ))
	if first {
		return x, z, true
	}
	if dtSeconds <= 0 {
		dtSeconds = 0.1
	}
	if dtSeconds > 1 {
		dtSeconds = 1
	}
	dx := x - prevX
	dz := z - prevZ
	dist := math.Hypot(dx, dz)
	if dist > MaxSpeed*dtSeconds {
		// Too fast: clamp to max distance along same direction instead of dropping.
		scale := (MaxSpeed * dtSeconds) / dist
		x = prevX + dx*scale
		z = prevZ + dz*scale
	}
	return x, z, true
}
