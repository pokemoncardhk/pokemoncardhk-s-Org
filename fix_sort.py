#!/usr/bin/env python3
# Fix the sort line in Home.tsx

with open('src/Home.tsx', 'r') as f:
    content = f.read()

# Count how many )) are at the end of sort lines
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'sort' in line and 'latest_price_hkd' in line:
        print(f"Before line {i+1}: {repr(line)}")
        # Fix: change )) to )) )  but actually we need to see the full context
        
print("---")
# Find the actual issue - count parentheses
import re
for i, line in enumerate(lines):
    if i >= 660 and i <= 670:
        print(f"{i+1}: {repr(line)}")
