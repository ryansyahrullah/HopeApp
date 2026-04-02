Get-ChildItem -Path 'd:\HopeApp\src' -Recurse -Include *.vue,*.js | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'useMockAuth') {
        $content = $content.Replace("import { useMockAuth } from '@/composables/useMockAuth'", "import { useAuth } from '@/composables/useAuth'")
        $content = $content.Replace('useMockAuth()', 'useAuth()')
        Set-Content $_.FullName $content -NoNewline
        Write-Host "Updated: $($_.Name)"
    }
}
