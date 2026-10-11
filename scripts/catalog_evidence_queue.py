"""Offline catalog evidence report, without external requests."""
import json
from pathlib import Path


def main():
    catalog = json.loads((Path(__file__).resolve().parents[1] / 'data/aircon_catalog.json').read_text())
    print(json.dumps({'records': len(catalog), 'market_denominator': None}))


if __name__ == '__main__':
    main()
