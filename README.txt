IoT Widget Studio - Simple Automated Screenshot QA
==================================================

Put these two files in your project's scripts folder:
  scripts\widget-qa.ps1
  scripts\widget-qa.cmd

Simplest usage
--------------

Cupertino / iOS, English + Persian:
  scripts\widget-qa.cmd ios

Or from PowerShell:
  .\scripts\widget-qa.ps1 ios

That is all you normally need.

Final output
------------

After running iOS QA, out contains only:

  out\ios-qa.zip

There is NO out\ios screenshot directory and there are NO nested screenshot ZIPs.
The temporary screenshot folders are deleted after the final archive is created.

Inside ios-qa.zip:

  en\
    widget-screenshots\
    full-screenshots\
    logs\
  fa\
    widget-screenshots\
    full-screenshots\
    logs\
  QA-MANIFEST.txt

So you only need to send:

  out\ios-qa.zip

Other examples
--------------

One theme, English only:
  scripts\widget-qa.cmd ios -Locale en

One theme, Persian only:
  scripts\widget-qa.cmd ios -Locale fa

Several themes:
  scripts\widget-qa.cmd -Themes ios,flat,gaming

All themes:
  scripts\widget-qa.cmd -Themes all

No theme argument:
  scripts\widget-qa.cmd

The script will ask which theme(s) to run.

What it automates
-----------------

For each selected theme and locale it:
- sets WIDGET_QA_THEME
- sets WIDGET_QA_LOCALE
- auto-detects Chrome / Edge / Chromium
- sets PLAYWRIGHT_CHROME_PATH
- runs npm run screenshots
- starts temporary Vite for the full-page pass
- runs npm run screenshots:full
- collects individual screenshots, contact sheets, report.json and logs
- creates ONE final ZIP per theme
- deletes staging/output screenshot folders afterward
- restores your previous environment variables

Examples of final files:

  out\ios-qa.zip
  out\flat-qa.zip
  out\gaming-qa.zip

If a QA phase fails, the archive is still created when possible and includes the logs for diagnosis.

Requirements
------------
- Windows PowerShell
- Node/npm installed
- Project dependencies installed
- Put the scripts in the project's scripts directory
