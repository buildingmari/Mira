#!/bin/bash
# Replace all #2C2416 color instances with MIRA brand colors in register.tsx

# Text colors: #2C2416 -> #1a1a2e
# Background/Borders with dark: #2C2416 -> #2D5BFF  
# Light backgrounds: #2C2416 -> #2D5BFF

# Patterns to replace:
# text-[#2C2416] -> text-[#1a1a2e]
# bg-[#2C2416] -> bg-[#2D5BFF]  
# border-[#2C2416] -> border-[#2D5BFF]
# focus:border-[#2C2416] -> focus:border-[#2D5BFF]
# hover:text-[#2C2416] -> hover:text-[#1a1a2e]
# placeholder:text-[#2C2416] -> placeholder:text-[#1a1a2e]

sed -i 's/text-\[#2C2416\]/text-[#1a1a2e]/g' /src/app/pages/register.tsx
sed -i 's/bg-\[#2C2416\]/bg-[#2D5BFF]/g' /src/app/pages/register.tsx
sed -i 's/border-\[#2C2416\]/border-[#2D5BFF]/g' /src/app/pages/register.tsx
sed -i 's/focus:border-\[#2C2416\]/focus:border-[#2D5BFF]/g' /src/app/pages/register.tsx
sed -i 's/hover:text-\[#2C2416\]/hover:text-[#1a1a2e]/g' /src/app/pages/register.tsx
sed -i 's/placeholder:text-\[#2C2416\]/placeholder:text-[#1a1a2e]/g' /src/app/pages/register.tsx
sed -i 's/hover:bg-\[#2C2416\]/hover:bg-[#2D5BFF]/g' /src/app/pages/register.tsx
sed -i 's/hover:border-\[#2C2416\]/hover:border-[#2D5BFF]/g' /src/app/pages/register.tsx

echo "Color replacement complete!"
