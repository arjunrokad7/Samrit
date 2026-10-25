$ErrorActionPreference = 'Stop'
$deckRoot = $PSScriptRoot
$deckPath = Join-Path $deckRoot 'Samrit_Final_Presentation.pptx'
$previewPath = Join-Path $deckRoot 'preview'
New-Item -ItemType Directory -Path $previewPath -Force | Out-Null
$powerPoint = New-Object -ComObject PowerPoint.Application
$presentation = $null
$oldAlerts = $powerPoint.DisplayAlerts
try {
    $powerPoint.DisplayAlerts = 1
    # WithWindow=false: render without opening a visible presentation window.
    $presentation = $powerPoint.Presentations.Open($deckPath, -1, 0, 0)
    $presentation.SaveAs((Join-Path $deckRoot 'Samrit_Final_Presentation.pdf'), 32)
    $presentation.Export($previewPath, 'PNG', 1600, 900)
    $overflow = @()
    foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
                $boundHeight = $shape.TextFrame2.TextRange.BoundHeight
                if ($boundHeight -gt ($shape.Height + 3)) {
                    $overflow += @{ slide=$slide.SlideIndex; text=$shape.TextFrame.TextRange.Text; textHeight=$boundHeight; boxHeight=$shape.Height }
                }
            }
        }
    }
    @{ slides=$presentation.Slides.Count; overflow=$overflow } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $deckRoot 'render_validation.json') -Encoding utf8
    Write-Output ('Exported PDF and slide previews. Slides: ' + $presentation.Slides.Count + '; text overflows: ' + $overflow.Count)
} finally {
    if ($presentation) { $presentation.Close() }
    $powerPoint.DisplayAlerts = $oldAlerts
    if ($powerPoint.Presentations.Count -eq 0) { $powerPoint.Quit() }
    [Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) | Out-Null
}
python (Join-Path $deckRoot 'finish_preview.py')
