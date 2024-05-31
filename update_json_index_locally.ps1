# Get a list of all JSON files in the folder, excluding those with "bug" in the filename
$jsonFiles = Get-ChildItem -Path "json" -Filter *.json | Where-Object { $_.Name -notmatch "Test" } | Select-Object -Expand Name

# Convert the list of JSON files to a JSON object || Write the JSON object to the output file
$jsonFiles | ConvertTo-Json | Out-File -FilePath "json/index.json"
