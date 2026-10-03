package world

import (
	"encoding/json"
	"net/http"
)

// District is the MVP slice: one polished district (Yaba) per guide.md §68-69.
type District struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Zones       []Zone `json:"zones"`
}

type Zone struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Building struct {
	ID    string  `json:"id"`
	Zone  string  `json:"zone"`
	Kind  string  `json:"kind"`
	Name  string  `json:"name"`
	X     float64 `json:"x"`
	Z     float64 `json:"z"`
	Open  bool    `json:"open"`
}

func Yaba() District {
	return District{
		ID:          "yaba",
		Name:        "Yaba",
		Description: "MVP district: residential streets, commercial strip, restaurant, shop, bank, church, mosque, club, park.",
		Zones: []Zone{
			{ID: "zone-a", Name: "Residential"},
			{ID: "zone-b", Name: "Commercial"},
			{ID: "zone-c", Name: "Market"},
			{ID: "zone-d", Name: "Parkside"},
		},
	}
}

func Buildings() []Building {
	return []Building{
		{ID: "apt-1", Zone: "zone-a", Kind: "apartment", Name: "Shared Apartments", X: -20, Z: 10, Open: true},
		{ID: "rest-1", Zone: "zone-b", Kind: "restaurant", Name: "Mama Put Spot", X: 10, Z: -5, Open: true},
		{ID: "shop-1", Zone: "zone-b", Kind: "shop", Name: "Corner Shop", X: 18, Z: 8, Open: true},
		{ID: "bank-1", Zone: "zone-b", Kind: "bank", Name: "Wazobia Bank", X: -8, Z: -18, Open: true},
		{ID: "church-1", Zone: "zone-d", Kind: "church", Name: "Community Church", X: -30, Z: -10, Open: true},
		{ID: "mosque-1", Zone: "zone-d", Kind: "mosque", Name: "Central Mosque", X: 30, Z: -12, Open: true},
		{ID: "club-1", Zone: "zone-c", Kind: "club", Name: "Nightlife Club", X: 25, Z: 25, Open: true},
		{ID: "park-1", Zone: "zone-d", Kind: "park", Name: "Freedom Park", X: 0, Z: 30, Open: true},
	}
}

type Handler struct{}

func (h *Handler) Routes(mux interface {
	Get(string, http.HandlerFunc)
}) {
	mux.Get("/api/world", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(Yaba())
	})
	mux.Get("/api/buildings", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(Buildings())
	})
}
