# Descarga Node.js (portable, sin instalar) en runtime\node\win-x64\ y verifica su SHA-256.
# Lo invoca Start-LoWKie.bat cuando no hay Node. No necesita permisos de administrador.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest es mucho más rápido sin barra de progreso
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$version = 'v24.22.1'   # Node 24 LTS (mantener igual que scripts/fetch-node.js)
$plat = 'win-x64'       # En Windows ARM se ejecuta por emulación
$file = "node-$version-$plat.zip"
$url = "https://nodejs.org/dist/$version"
$root = Split-Path -Parent $PSScriptRoot
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("lowkie-node-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Write-Host "Descargando Node.js $version ($plat), unos 30 MB..."
  Invoke-WebRequest -UseBasicParsing -Uri "$url/$file" -OutFile (Join-Path $tmp $file)
  $sums = (Invoke-WebRequest -UseBasicParsing -Uri "$url/SHASUMS256.txt").Content -split "`n"
  $expected = (($sums | Where-Object { $_ -match "  $([regex]::Escape($file))\s*$" }) -split '\s+')[0]
  $actual = (Get-FileHash -Algorithm SHA256 (Join-Path $tmp $file)).Hash.ToLower()
  if (-not $expected -or $expected.ToLower() -ne $actual) { throw 'La verificacion de integridad ha fallado. No se instala nada.' }
  Expand-Archive -Path (Join-Path $tmp $file) -DestinationPath $tmp -Force
  $dest = Join-Path $root "runtime\node\$plat"
  New-Item -ItemType Directory -Path (Join-Path $root 'runtime\node') -Force | Out-Null
  if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
  Move-Item (Join-Path $tmp "node-$version-$plat") $dest
  Write-Host "Node.js listo en runtime\node\$plat"
} catch {
  Write-Host "No se pudo preparar Node.js: $($_.Exception.Message)"
  exit 1
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
