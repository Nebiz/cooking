@echo off
setlocal enabledelayedexpansion
set "json_list="

rem Collect all JSON filenames into the json_list variable
for /f "delims=" %%f in ('dir /b "json\*.json"') do (
    if not defined json_list (
        set "json_list="%%f""
    ) else (
        set "json_list=!json_list!, "%%f""
    )
)

(
    echo {
    echo "files": [!json_list!]
    echo }
) > json_index.json

::echo [!json_list!] > json_index.json