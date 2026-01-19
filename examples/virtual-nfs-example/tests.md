touch file to trigger reload

```
current=$(stat -f "%m" readme.md); 
touch -t $(date -r $((current-1)) +%Y%m%d%H%M.%S) readme.md; 
touch -t $(date -r $current +%Y%m%d%H%M.%S) readme.md
```


Touch with specified date:
```
TZ=UTC touch -t 197001010000.00 readme.md
```