const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const distDir = path.join(root, 'dist');
const versionDir = path.join(distDir, pkg.version);
const installerName = `Self-hosted-bot-by-Core-Setup-${pkg.version}.exe`;
const updaterName = `Self-hosted-bot-by-Core-Updater-${pkg.version}.zip`;
const updaterExeName = `Self-hosted-bot-by-Core-Updater-${pkg.version}.exe`;
const installerPath = path.join(versionDir, installerName);
const updaterPath = path.join(versionDir, updaterName);
const updaterExePath = path.join(versionDir, updaterExeName);
const stageRoot = path.join(os.tmpdir(), `self-hosted-bot-core-updater-build-${pkg.version}`);
const workDir = path.join(stageRoot, 'payload');
const nsisPath = path.join(stageRoot, 'updater.nsi');

const ps1 = String.raw`$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Version = '__VERSION__'
$ProductName = 'Self-hosted bot by Core'
$InstallerName = "Self-hosted-bot-by-Core-Setup-$Version.exe"
$InstallerPath = Join-Path $PSScriptRoot $InstallerName

function Write-Step($Message) {
  Write-Host "[Core Updater] $Message"
}

function Get-UninstallEntries {
  $roots = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
  )

  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        $entry = Get-ItemProperty $_.PsPath -ErrorAction Stop
        if ($entry.DisplayName -eq $ProductName -or $entry.DisplayName -eq 'Self-hosted Bot by Core') {
          $entry
        }
      } catch {
        # Ignore broken uninstall entries.
      }
    }
  }
}

function Get-InstallPathFromUninstallString($Value) {
  $text = [string]$Value
  if (-not $text) { return $null }

  $match = [regex]::Match($text, '"([^"]+)"')
  if ($match.Success) {
    $candidate = Split-Path -Parent $match.Groups[1].Value
    if ($candidate -and (Test-Path -LiteralPath $candidate)) { return $candidate }
  }

  $firstToken = $text.Split(' ')[0]
  if ($firstToken -and (Test-Path -LiteralPath $firstToken)) {
    return Split-Path -Parent $firstToken
  }

  return $null
}

function Get-InstallPath {
  $entries = @(Get-UninstallEntries)

  foreach ($entry in $entries) {
    if ($entry.InstallLocation -and (Test-Path -LiteralPath $entry.InstallLocation)) {
      return $entry.InstallLocation
    }

    $fromUninstall = Get-InstallPathFromUninstallString $entry.UninstallString
    if ($fromUninstall) { return $fromUninstall }
  }

  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\Self-hosted bot by Core'),
    (Join-Path $env:ProgramFiles 'Self-hosted bot by Core')
  )

  $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
  if ($programFilesX86) {
    $candidates += (Join-Path $programFilesX86 'Self-hosted bot by Core')
  }

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) { return $candidate }
  }

  return $candidates[0]
}

function Stop-InstalledProcesses($InstallPath) {
  if (-not $InstallPath) { return }

  $normalized = $InstallPath.TrimEnd('\').ToLowerInvariant()
  $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ExecutablePath -and $_.ExecutablePath.ToLowerInvariant().StartsWith($normalized)
  }

  foreach ($process in $processes) {
    try {
      Write-Step "Stopping running process: $($process.ProcessId)"
      Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
    } catch {
      Write-Step "Could not stop process $($process.ProcessId): $($_.Exception.Message)"
    }
  }
}

if (-not (Test-Path -LiteralPath $InstallerPath)) {
  Write-Error "Installer not found near updater: $InstallerPath"
  exit 1
}

$InstallPath = Get-InstallPath
Write-Step "Target version: $Version"
Write-Step "Installer: $InstallerPath"
Write-Step "Detected install path: $InstallPath"

Stop-InstalledProcesses $InstallPath

$arguments = @('/S', '/currentuser', "/D=$InstallPath")
Write-Step 'Installing update...'
$process = Start-Process -FilePath $InstallerPath -ArgumentList $arguments -Wait -PassThru

if ($process.ExitCode -ne 0) {
  Write-Error "Installer exited with code $($process.ExitCode)."
  exit $process.ExitCode
}

Write-Step 'Update completed. Your settings and APPDATA data were preserved.'
exit 0
`;

const cmd = String.raw`@echo off
setlocal
title Self-hosted bot by Core Updater
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Update-Self-hosted-bot-by-Core.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" (
  echo Update failed with code %EXITCODE%.
) else (
  echo Update completed successfully.
)
echo.
pause
exit /b %EXITCODE%
`;

const readme = `Self-hosted bot by Core Updater ${pkg.version}

RU:
1. Распакуйте этот ZIP в отдельную папку.
2. Запустите Update-Self-hosted-bot-by-Core.cmd.
3. Updater найдёт установленную папку приложения и установит новую версию поверх старой.
4. Настройки, SQLite база и APPDATA не удаляются.

EN:
1. Extract this ZIP into a separate folder.
2. Run Update-Self-hosted-bot-by-Core.cmd.
3. The updater detects the installed app path and installs the new version over the old one.
4. Settings, SQLite database and APPDATA are preserved.

Note:
Use the updater for the installed Windows app. For portable builds, download the new portable ZIP and replace the old portable folder manually.
`;

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function runPowerShellZip() {
  const command = 'Compress-Archive -Path (Join-Path $env:UPDATER_DIR "*") -DestinationPath $env:ZIP_PATH -Force';
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    cwd: root,
    env: {
      ...process.env,
      UPDATER_DIR: workDir,
      ZIP_PATH: updaterPath
    },
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(`Compress-Archive failed:\n${result.stdout || ''}\n${result.stderr || ''}`);
  }
}

function findFileByName(dir, fileName, depth = 0) {
  if (!dir || depth > 8 || !fs.existsSync(dir)) return null;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
      return fullPath;
    }
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const found = findFileByName(path.join(dir, entry.name), fileName, depth + 1);
    if (found) return found;
  }

  return null;
}

function findMakensis() {
  const candidates = [
    process.env.MAKENSIS,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache') : null,
    process.env.APPDATA ? path.join(process.env.APPDATA, 'electron-builder', 'Cache') : null,
    path.join(root, 'node_modules')
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

    const found = findFileByName(candidate, 'makensis.exe');
    if (found) return found;
  }

  return null;
}

function nsisString(value) {
  return String(value)
    .replace(/\$/g, '$$')
    .replace(/"/g, '$\\"')
    .replace(/\r?\n/g, ' ');
}

function createNsisScript() {
  const productVersion = `${pkg.version}.0`.split('.').slice(0, 4).join('.');

  return `Unicode true
SetCompressor /SOLID lzma
Name "Self-hosted bot by Core Updater ${nsisString(pkg.version)}"
OutFile "${nsisString(updaterExePath)}"
RequestExecutionLevel highest
ShowInstDetails show
AutoCloseWindow false
BrandingText "Self-hosted bot by Core"
VIProductVersion "${productVersion}"
VIAddVersionKey "ProductName" "Self-hosted bot by Core Updater"
VIAddVersionKey "CompanyName" "Core"
VIAddVersionKey "FileDescription" "Self-hosted bot by Core updater"
VIAddVersionKey "FileVersion" "${nsisString(pkg.version)}"
VIAddVersionKey "ProductVersion" "${nsisString(pkg.version)}"

Page instfiles

Section "Update"
  SetOutPath "$TEMP\\Self-hosted-bot-by-Core-Updater-${nsisString(pkg.version)}"
  File "${nsisString(path.join(workDir, installerName))}"
  File "${nsisString(path.join(workDir, 'Update-Self-hosted-bot-by-Core.ps1'))}"
  File "${nsisString(path.join(workDir, 'Update-Self-hosted-bot-by-Core.cmd'))}"
  File "${nsisString(path.join(workDir, 'README_UPDATER_RU_EN.txt'))}"
  DetailPrint "Starting Self-hosted bot by Core updater..."
  ExecWait '"$SYSDIR\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "$OUTDIR\\Update-Self-hosted-bot-by-Core.ps1"' $0
  DetailPrint "Updater finished with code $0"
  SetOutPath "$TEMP"
  RMDir /r "$TEMP\\Self-hosted-bot-by-Core-Updater-${nsisString(pkg.version)}"
  SetErrorLevel $0
SectionEnd
`;
}

function runNsis() {
  const makensis = findMakensis();
  if (!makensis) {
    console.log('makensis.exe was not found; updater EXE was not created.');
    return false;
  }

  fs.rmSync(updaterExePath, { force: true });
  fs.writeFileSync(nsisPath, createNsisScript(), 'utf8');

  const result = spawnSync(makensis, ['/V2', nsisPath], {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.status !== 0 || !fs.existsSync(updaterExePath)) {
    throw new Error(`NSIS failed with status ${result.status}. Debug script: ${nsisPath}\n${result.stdout || ''}\n${result.stderr || ''}`);
  }

  return true;
}

function main() {
  if (!fs.existsSync(installerPath)) {
    throw new Error(`Universal installer not found: ${path.relative(root, installerPath)}`);
  }

  cleanDir(stageRoot);
  fs.mkdirSync(workDir, { recursive: true });
  fs.copyFileSync(installerPath, path.join(workDir, installerName));
  fs.writeFileSync(path.join(workDir, 'Update-Self-hosted-bot-by-Core.ps1'), ps1.replaceAll('__VERSION__', pkg.version), 'utf8');
  fs.writeFileSync(path.join(workDir, 'Update-Self-hosted-bot-by-Core.cmd'), cmd, 'utf8');
  fs.writeFileSync(path.join(workDir, 'README_UPDATER_RU_EN.txt'), readme, 'utf8');
  fs.rmSync(updaterPath, { force: true });

  runPowerShellZip();
  const exeCreated = runNsis();
  fs.rmSync(stageRoot, { recursive: true, force: true });

  console.log(`Created updater archive: ${path.relative(root, updaterPath)}`);
  if (exeCreated) console.log(`Created updater executable: ${path.relative(root, updaterExePath)}`);
}

main();
