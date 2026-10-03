package websocket

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/redis/go-redis/v9"

	"github.com/JEWOOLAFAVOUR/wazobia/apps/server/internal/movement"
)

// Hub keeps realtime presence in Redis (TTL heartbeats) and relays
// messages only within a zone (interest management, guide.md §24).
type Hub struct {
	RDB *redis.Client
	mu  sync.Mutex
	// zone -> set of subscribers (same-process fan-out; cross-instance via Redis pub/sub in V2)
	subs map[string]map[*peer]struct{}
}

type peer struct {
	userID string
	zone   string
	conn   *websocket.Conn
	send   chan []byte
	// Authoritative last-known position for speed validation (§25).
	lastX, lastZ float64
	lastAt      time.Time
	hasPos      bool
}

func NewHub(rdb *redis.Client) *Hub {
	return &Hub{RDB: rdb, subs: map[string]map[*peer]struct{}{}}
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "guest"
	}
	zone := r.URL.Query().Get("zone")
	if zone == "" {
		zone = "zone-b"
	}
	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{OriginPatterns: []string{"*"}})
	if err != nil {
		return
	}
	p := &peer{userID: userID, zone: zone, conn: c, send: make(chan []byte, 64)}
	h.add(p)
	defer func() { h.remove(p); _ = c.CloseNow() }()

	// Presence heartbeat → Redis with TTL (guide.md §23). Never Postgres per frame.
	if h.RDB != nil {
		ctx := context.Background()
		_ = h.RDB.HSet(ctx, "presence:"+userID, map[string]interface{}{
			"status": "online", "zone": zone, "lastSeen": time.Now().Unix(),
		}).Err()
		_ = h.RDB.Expire(ctx, "presence:"+userID, 30*time.Second).Err()
	}

	ctx := r.Context()
	go h.writeLoop(ctx, p)
	h.readLoop(ctx, p)
}

func (h *Hub) add(p *peer) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.subs[p.zone] == nil {
		h.subs[p.zone] = map[*peer]struct{}{}
	}
	h.subs[p.zone][p] = struct{}{}
}

func (h *Hub) remove(p *peer) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.subs[p.zone], p)
	if h.RDB != nil {
		_ = h.RDB.Del(context.Background(), "presence:"+p.userID).Err()
	}
}

func (h *Hub) readLoop(ctx context.Context, p *peer) {
	for {
		_, data, err := p.conn.Read(ctx)
		if err != nil {
			return
		}
		// Refresh presence TTL on activity.
		if h.RDB != nil {
			_ = h.RDB.Expire(context.Background(), "presence:"+p.userID, 30*time.Second).Err()
		}
		if validated, ok := h.validateMove(p, data); ok {
			h.broadcast(p.zone, validated, p)
			// Refresh position in Redis (ephemeral only).
			if h.RDB != nil {
				var msg map[string]interface{}
				if json.Unmarshal(validated, &msg) == nil {
					_ = h.RDB.HSet(context.Background(), "presence:"+p.userID, map[string]interface{}{
						"x": msg["x"], "z": msg["z"], "lastSeen": time.Now().Unix(),
					}).Err()
				}
			}
		}
	}
}

// validateMove parses a client move intent, clamps it server-side, and
// returns the authoritative payload to relay. Non-move messages pass through.
func (h *Hub) validateMove(p *peer, data []byte) ([]byte, bool) {
	var msg map[string]interface{}
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, false
	}
	if msg["type"] != "move" {
		return data, true
	}
	x, _ := msg["x"].(float64)
	z, _ := msg["z"].(float64)
	now := time.Now()
	dt := 0.1
	if p.hasPos {
		dt = now.Sub(p.lastAt).Seconds()
	}
	nx, nz, ok := movement.ValidateMove(p.lastX, p.lastZ, x, z, dt, !p.hasPos)
	if !ok {
		return nil, false
	}
	p.lastX, p.lastZ, p.lastAt, p.hasPos = nx, nz, now, true
	msg["x"], msg["z"] = nx, nz
	msg["userId"] = p.userID
	msg["zone"] = p.zone
	out, _ := json.Marshal(msg)
	return out, true
}

func (h *Hub) writeLoop(ctx context.Context, p *peer) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-p.send:
			_ = p.conn.Write(ctx, websocket.MessageText, msg)
		}
	}
}

func (h *Hub) broadcast(zone string, data []byte, skip *peer) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for sub := range h.subs[zone] {
		if sub == skip {
			continue
		}
		select {
		case sub.send <- data:
		default:
		}
	}
}
