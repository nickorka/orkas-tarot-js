"""Convert the Streamlit Python card data to JSON for the Node.js app.

Imports the original data modules and dumps every card with identical
fields, guaranteeing 100% text fidelity in the port.
"""
import json
import sys

sys.path.insert(0, "/home/z/my-project/repo_source/tarot_dcm/streamlit")

from data.major_arcana import MAJOR_ARCANA          # noqa: E402
from data.suits_wands import WANDS                  # noqa: E402
from data.suits_cups import CUPS                    # noqa: E402
from data.suits_swords import SWORDS                # noqa: E402
from data.suits_pentacles import PENTACLES          # noqa: E402

cards = []

for card_id, name, numeral, keywords, meaning, upright, rev in MAJOR_ARCANA:
    cards.append({
        "cardId": card_id,
        "name": name,
        "arcana": "Major Arcana",
        "rank": numeral,
        "keywords": keywords,
        "meaning": meaning,
        "upright": upright,
        "reversed": rev,
    })

for suit, suit_data in (("Wands", WANDS), ("Cups", CUPS),
                        ("Swords", SWORDS), ("Pentacles", PENTACLES)):
    for card_id, rank, keywords, meaning, upright, rev in suit_data:
        cards.append({
            "cardId": card_id,
            "name": f"{rank} of {suit}",
            "arcana": suit,
            "rank": rank,
            "keywords": keywords,
            "meaning": meaning,
            "upright": upright,
            "reversed": rev,
        })

assert len(cards) == 78, f"expected 78 cards, got {len(cards)}"
assert len({c["cardId"] for c in cards}) == 78, "duplicate ids"

out = "/home/z/my-project/src/data/tarot-deck.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(cards, f, ensure_ascii=False, indent=1)

print(f"wrote {len(cards)} cards to {out}")
print("first:", cards[0]["name"], "| last:", cards[-1]["name"])
print("majors:", sum(1 for c in cards if c["arcana"] == "Major Arcana"))
