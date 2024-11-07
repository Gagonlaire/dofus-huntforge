<h1 align="center">DofusDB (Treasure Hunt) scrapper</h1>

This script uses Puppeteer to scrape DofusDB's treasure hunt data. Additional installation may be required (check Puppeteer requirements).

# Disclaimer

This tool retrieves data but **does not include or distribute pre-scraped data**. Users must ensure their use complies
with applicable laws, terms of service, and copyright policies. By using this tool, you agree to verify that your data
retrieval activities are lawful and respect intellectual property rights.

**Important**: The author of this project assumes no liability for how the scraping tool is used. Please be mindful of
ethical and legal considerations when accessing and utilizing third-party data.

# Environment Variables Documentation

## User Data Dir

```
USER_DATA_DIR=example/path
```

Directory path for Chrome user data. Check `chrome://version/` for the correct path. This setting helps improve script
stealth by using your actual Chrome profile.

## Executable Path

```
EXECUTABLE_PATH=example/path
```

Path to browser executable, you can check `chrome://version/` for any V8 engine-based browser. Using your real browser
helps improve script stealth.

## Manual Mode

```
MANUAL=false
```

If set to `true`, you will need to manually set positions and click coordinates. The script will only sniff requests,
parse, and store the data. This can be useful if Google reCAPTCHA is too strong.

## Headless Mode

```
HEADLESS=true
```

Controls browser visibility. When `true`, browser runs in background. Note: This setting overrides the `MANUAL`
variable.

## Output Path

```
OUTPUT_PATH=example/path
```

Destination path for generated data and results from the program's execution.

## Load Save

```
LOAD_SAVE=false
```

Toggle for loading previously saved progress. When enabled, the program will resume from the last saved state.

## Save Path

```
SAVE_PATH=example/path
```

Location for saving program progress. Used in conjunction with `LOAD_SAVE` to store and retrieve program state.
