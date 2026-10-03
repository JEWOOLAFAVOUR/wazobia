package movement

import "testing"

func TestValidateMoveClampsBounds(t *testing.T) {
	x, z, ok := ValidateMove(0, 0, 999, -999, 0.1, true)
	if !ok {
		t.Fatal("expected ok")
	}
	if x != MaxX || z != MinZ {
		t.Fatalf("expected clamp to (%v,%v), got (%v,%v)", MaxX, MinZ, x, z)
	}
}

func TestValidateMoveClampsSpeed(t *testing.T) {
	// 100m in 0.1s is impossible → clamp to 1.5m.
	x, _, ok := ValidateMove(0, 0, 100, 0, 0.1, false)
	if !ok {
		t.Fatal("expected ok")
	}
	if x != MaxSpeed*0.1 {
		t.Fatalf("expected x=%v, got %v", MaxSpeed*0.1, x)
	}
}

func TestValidateMoveRejectsNaN(t *testing.T) {
	_, _, ok := ValidateMove(0, 0, nan(), 0, 0.1, false)
	if ok {
		t.Fatal("expected reject NaN")
	}
}

func nan() float64 {
	var z float64
	return z / z
}
