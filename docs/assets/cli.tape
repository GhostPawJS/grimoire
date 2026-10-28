# Re-record: PATH with the ghostpaw-grimoire release binary first, then `vhs docs/assets/cli.tape`
Output docs/assets/cli.gif
Set Shell bash
Set FontSize 18
Set Width 1600
Set Height 600
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 15ms
Set WindowBar Colorful
Hide
Type "export PS1='grimoire $ ' W=$(mktemp -d) && export GHOSTPAW_GRIMOIRE_DB=$W/grimoire.db GHOSTPAW_GRIMOIRE_ROOT=$W/spells && cd $W && clear"
Enter
Show
Type `ghostpaw-grimoire --version`
Sleep 200ms
Enter
Sleep 900ms
Type `printf -- '---\nname: release-checklist\ndescription: Steps before tagging a release.\n---\n1. Wait for CI to pass.\n2. Tag with bin/release.sh.\n' > SKILL.md`
Sleep 200ms
Enter
Sleep 600ms
Type `ghostpaw-grimoire spell inscribe release-checklist --chapter shipping --content @SKILL.md --compact | jq -c '{summary, path: .data.path}'`
Sleep 200ms
Enter
Sleep 1200ms
Type `ghostpaw-grimoire note drop "@ci: tagging before CI went green broke a publish" --source retro --compact | jq -c .summary`
Sleep 200ms
Enter
Sleep 1000ms
Type `ghostpaw-grimoire review notes --compact | jq -c '.data.notes[] | {id, source, content}'`
Sleep 200ms
Enter
Sleep 1000ms
Type `ghostpaw-grimoire search "tagging release" --compact | jq -c '.data.results[] | {path, tier, rank, score}'`
Sleep 200ms
Enter
Sleep 1000ms
Type `ghostpaw-grimoire inspect shipping/release-checklist --compact | jq -c '.data.history[] | {shortHash, subject, date}'`
Sleep 200ms
Enter
Sleep 1500ms
Type `find spells -name SKILL.md`
Sleep 200ms
Enter
Sleep 2s
Screenshot docs/assets/cli.png
