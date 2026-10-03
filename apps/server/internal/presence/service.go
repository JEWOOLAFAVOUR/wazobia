package presence

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

// Presence is the ephemeral realtime state (Redis only, never Postgres).
type Presence struct {
	UserID   string  `json:"userId"`
	Status   string  `json:"status"`
	District string  `json:"district"`
	Zone     string  `json:"zone"`
	X        float64 `json:"x"`
	Z        float64 `json:"z"`
	LastSeen int64   `json:"lastSeen"`
}

type Service struct {
	RDB *redis.Client
}

func NewService(rdb *redis.Client) *Service { return &Service{RDB: rdb} }

func (s *Service) Routes(mux interface {
	Get(string, http.HandlerFunc)
}) {
	mux.Get("/api/presence", s.handleList)
}

func (s *Service) handleList(w http.ResponseWriter, r *http.Request) {
	zone := r.URL.Query().Get("zone")
	list, _ := s.List(r.Context(), zone)
	if list == nil {
		list = []Presence{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

// List scans presence:* keys. Fine for <10k online; paginate/shard in Phase 9.
func (s *Service) List(ctx context.Context, zone string) ([]Presence, error) {
	if s.RDB == nil {
		return []Presence{}, nil
	}
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	keys, err := s.RDB.Keys(ctx, "presence:*").Result()
	if err != nil {
		return nil, err
	}
	out := make([]Presence, 0, len(keys))
	for _, k := range keys {
		m, err := s.RDB.HGetAll(ctx, k).Result()
		if err != nil || len(m) == 0 {
			continue
		}
		p := Presence{Status: "online", District: "yaba"}
		_, _ = p.UserID, 0
		p.UserID = k[len("presence:"):]
		p.Zone = m["zone"]
		if zone != "" && p.Zone != zone {
			continue
		}
		p.Status = firstNonEmpty(m["status"], "online")
		p.District = firstNonEmpty(m["district"], "yaba")
		p.LastSeen = atoi64(m["lastSeen"])
		p.X = atof(m["x"])
		p.Z = atof(m["z"])
		out = append(out, p)
	}
	return out, nil
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func atoi64(s string) int64 {
	var n int64
	for _, c := range s {
		if c < '0' || c > '9' {
			break
		}
		n = n*10 + int64(c-'0')
	}
	return n
}

func atof(s string) float64 {
	var n float64
	var frac float64 = 1
	var dot bool
	var neg bool
	for i, c := range s {
		if i == 0 && c == '-' {
			neg = true
			continue
		}
		if c == '.' {
			dot = true
			continue
		}
		if c < '0' || c > '9' {
			break
		}
		if !dot {
			n = n*10 + float64(c-'0')
		} else {
			frac *= 10
			n += float64(c-'0') / frac
		}
	}
	if neg {
		n = -n
	}
	return n
}
