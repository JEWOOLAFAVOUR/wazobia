package chat

import "strings"

// Scopes for slice 1: zone (nearby) + global (Lagos). Business/org/event/private land later.
const (
	ScopeZone   = "zone"
	ScopeGlobal = "global"
	MaxLen      = 280
)

// ValidateChat trims + enforces scope and length. Returns cleaned text.
func ValidateChat(scope, text string) (string, bool) {
	if scope != ScopeZone && scope != ScopeGlobal {
		return "", false
	}
	t := strings.TrimSpace(text)
	if t == "" || len([]rune(t)) > MaxLen {
		return "", false
	}
	return t, true
}
