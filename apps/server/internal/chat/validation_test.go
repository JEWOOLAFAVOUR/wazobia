package chat

import (
	"strings"
	"testing"
)

func TestValidateChatOK(t *testing.T) {
	if _, ok := ValidateChat("zone", "hello Yaba"); !ok {
		t.Fatal("expected ok")
	}
	if _, ok := ValidateChat("global", "anybody going VI?"); !ok {
		t.Fatal("expected ok")
	}
}

func TestValidateChatRejects(t *testing.T) {
	if _, ok := ValidateChat("dm", "hi"); ok {
		t.Fatal("bad scope should fail")
	}
	if _, ok := ValidateChat("zone", "   "); ok {
		t.Fatal("empty should fail")
	}
	if _, ok := ValidateChat("zone", strings.Repeat("x", MaxLen+1)); ok {
		t.Fatal("too long should fail")
	}
}
