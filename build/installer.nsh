!macro customHeader
  !define MUI_ABORTWARNING
  !define MUI_FINISHPAGE_NOAUTOCLOSE
  !define MUI_UNFINISHPAGE_NOAUTOCLOSE
!macroend

!macro customInit
  SetShellVarContext current
!macroend

!macro customInstall
  DetailPrint "Self-hosted bot by Core installed."
  DetailPrint "Open the control panel, fill in the Discord settings, then press Start."
!macroend

!macro customUnInstall
  SetShellVarContext current
  DetailPrint "Removing Self-hosted bot by Core app data..."
  RMDir /r "$APPDATA\Self-hosted bot by Core"
  RMDir /r "$LOCALAPPDATA\Self-hosted bot by Core"
  RMDir /r "$APPDATA\core-discord-bot"
  RMDir /r "$LOCALAPPDATA\core-discord-bot"
  DetailPrint "Self-hosted bot by Core removed."
!macroend
