Param(
    [int]$scale = 3
)

$in = 'public\follow_flow_logo.png'
$out = 'public\follow_flow_logo_3x.png'

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($in)
$newW = [int]($img.Width * $scale)
$newH = [int]($img.Height * $scale)
$bmp = New-Object System.Drawing.Bitmap $newW, $newH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0,0, $newW, $newH)
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
Write-Output "Saved: $out, Size: $newW x $newH"