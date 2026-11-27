# Draws icon-192.png and icon-512.png (original artwork: a gold rail line
# with sleepers and three station dots on a dark background).
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
foreach ($size in 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $s = $size / 512.0
  $g.Clear([System.Drawing.Color]::FromArgb(43, 33, 26))
  $gold = [System.Drawing.Color]::FromArgb(201, 149, 46)
  $cream = [System.Drawing.Color]::FromArgb(241, 227, 196)
  $red = [System.Drawing.Color]::FromArgb(163, 54, 31)
  # curved track through the safe zone
  $pts = @(
    (New-Object System.Drawing.PointF (120*$s), (360*$s)),
    (New-Object System.Drawing.PointF (200*$s), (230*$s)),
    (New-Object System.Drawing.PointF (310*$s), (290*$s)),
    (New-Object System.Drawing.PointF (392*$s), (160*$s))
  )
  $ties = New-Object System.Drawing.Pen $cream, (34*$s)
  $ties.DashPattern = @(0.25, 0.55)
  $g.DrawCurve($ties, $pts)
  $rail = New-Object System.Drawing.Pen $gold, (14*$s)
  $rail.StartCap = 'Round'; $rail.EndCap = 'Round'
  $g.DrawCurve($rail, $pts)
  foreach ($p in $pts[0], $pts[3]) {
    $r = 30*$s
    $g.FillEllipse((New-Object System.Drawing.SolidBrush $cream), $p.X-$r, $p.Y-$r, 2*$r, 2*$r)
    $g.DrawEllipse((New-Object System.Drawing.Pen $red, (10*$s)), $p.X-$r, $p.Y-$r, 2*$r, 2*$r)
  }
  $bmp.Save((Join-Path $root "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
