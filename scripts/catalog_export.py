"""Explicit maintainer export; never used by the scheduled watcher."""
from catalog_watcher import ROOT, inline_catalog, write

if __name__ == '__main__':
    write(ROOT / 'data/aircon_catalog.json', inline_catalog())
    print('Exported runtime PRODUCTS mirror. Review diff before committing.')
