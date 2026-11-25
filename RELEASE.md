# Release-Ablauf OEDIV Webflow

## Staging (*.webflow.io)
Loader lädt automatisch den neuesten Commit von main per Hash (@<sha>). Kein Purge nötig.

## Live
Loader lädt eine feste Version (Git-Tag, z. B. @v1.0.0). Tags sind auf jsDelivr unveränderlich.

### Neue Live-Version
1. Änderungen auf main sind auf Staging getestet und abgenommen.
2. Tag setzen (SemVer):
   - Fix: v1.0.x · neues Feature: v1.x.0 · Umbau/Breaking: vx.0.0
   - git tag vX.Y.Z && git push origin vX.Y.Z
3. SRI-Hashes erzeugen (siehe unten) und im Webflow-Head/Loader eintragen.
4. In Webflow LIVE_VERSION auf vX.Y.Z setzen, CSS-Link im Head aktualisieren, publishen.

### SRI-Hash erzeugen
curl -s https://cdn.jsdelivr.net/gh/alexbraklowbsi/oediv-webflow@vX.Y.Z/site.css | openssl dgst -sha384 -binary | openssl base64 -A
curl -s https://cdn.jsdelivr.net/gh/alexbraklowbsi/oediv-webflow@vX.Y.Z/site.js  | openssl dgst -sha384 -binary | openssl base64 -A

## Später: FTP-Export
site.js/site.css lokal ausliefern, Version im Dateinamen (site.v1.0.0.js) oder per ?v=1.0.0.
