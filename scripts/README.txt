IoT Widget Studio - Clean Single-Archive QA Runner
==================================================

Put these files in your project's scripts folder:
  scripts\widget-qa.ps1
  scripts\widget-qa.cmd

Normal usage
------------
Cupertino / iOS, English + Persian:
  scripts\widget-qa.cmd ios

Final output:
  out\ios-qa.zip

The final archive contains only fresh output for the requested theme:
  en\widget-screenshots\ios\...
  en\full-screenshots\ios\...
  en\logs\...
  fa\widget-screenshots\ios\...
  fa\full-screenshots\ios\...
  fa\logs\...
  QA-MANIFEST.txt

Important fixes in this version
-------------------------------
- Clears raw screenshot output before EVERY theme/locale pass.
- Copies only the requested theme into the staging bundle.
- Prevents stale flat/minimal/gaming/glass screenshots leaking into ios-qa.zip.
- Keeps report.json and SUMMARY.txt from the same fresh run.
- Produces one ZIP only; no persistent screenshot directories or nested ZIPs.
- Uses .NET ZIP creation from the staging directory for a cleaner archive.

Other examples
--------------
English only:
  scripts\widget-qa.cmd ios -Locale en

Persian only:
  scripts\widget-qa.cmd ios -Locale fa

Several themes:
  scripts\widget-qa.cmd -Themes ios,flat,gaming

All themes:
  scripts\widget-qa.cmd -Themes all
